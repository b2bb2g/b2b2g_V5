import { createClient } from "@/lib/supabase/server";

// CSV export of the member list (PRD 17.2). Contains contact data, so the
// export itself is written to the audit log.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });
  const [{ data: allowed }, { data: assurance }] = await Promise.all([
    supabase.rpc("has_admin_permission", { requested: "members" }),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!allowed) return new Response(null, { status: 403 });
  if (assurance?.currentLevel !== "aal2") {
    return new Response(null, {
      status: 403,
      headers: { "X-B2BB2G-MFA-Required": "true" },
    });
  }

  const { data } = await supabase
    .from("profiles")
    .select(
      "uid, display_name, company_name, status, is_coordinator, created_at, profile_contacts(email, phone)"
    )
    .order("uid")
    .limit(10000);

  const rows = (data ?? []) as unknown as {
    uid: number;
    display_name: string | null;
    company_name: string | null;
    status: string;
    is_coordinator: boolean;
    created_at: string;
    profile_contacts: { email: string | null; phone: string | null } | null;
  }[];

  const escape = (value: string | number | boolean | null | undefined) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = "uid,name,company,email,phone,status,coordinator,joined";
  const body = rows
    .map((r) =>
      [
        r.uid,
        r.display_name,
        r.company_name,
        r.profile_contacts?.email,
        r.profile_contacts?.phone,
        r.status,
        r.is_coordinator,
        r.created_at.slice(0, 10),
      ]
        .map(escape)
        .join(",")
    )
    .join("\n");

  await supabase.rpc("log_audit", {
    a_action: "member_export_csv",
    a_target_type: "profile",
    a_target_id: "all",
    a_detail: { rows: rows.length },
  });

  return new Response(`﻿${header}\n${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
