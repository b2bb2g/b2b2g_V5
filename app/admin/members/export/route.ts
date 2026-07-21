import { createClient } from "@/lib/supabase/server";

// CSV export of the member list (PRD 17.2). Contains contact data, so the
// export itself is written to the audit log.
export async function GET(request: Request) {
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

  // ?marketing=opted narrows the export to members who agreed to marketing —
  // the campaign send list.
  const optedOnly =
    new URL(request.url).searchParams.get("marketing") === "opted";

  let query = supabase
    .from("profiles")
    .select(
      "uid, display_name, company_name, status, is_coordinator, marketing_consent, marketing_consent_at, created_at, profile_contacts(email, phone)"
    )
    .order("uid")
    .limit(10000);
  if (optedOnly) query = query.eq("marketing_consent", true);
  const { data } = await query;

  const rows = (data ?? []) as unknown as {
    uid: number;
    display_name: string | null;
    company_name: string | null;
    status: string;
    is_coordinator: boolean;
    marketing_consent: boolean;
    marketing_consent_at: string | null;
    created_at: string;
    profile_contacts: { email: string | null; phone: string | null } | null;
  }[];

  const escape = (value: string | number | boolean | null | undefined) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header =
    "uid,name,company,email,phone,status,coordinator,marketing_consent,marketing_consent_at,joined";
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
        r.marketing_consent,
        r.marketing_consent_at?.slice(0, 10) ?? "",
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
    a_detail: { rows: rows.length, marketing_opted_only: optedOnly },
  });

  const suffix = optedOnly ? "-marketing" : "";
  return new Response(`﻿${header}\n${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members${suffix}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
