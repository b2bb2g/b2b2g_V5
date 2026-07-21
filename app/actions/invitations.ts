"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hashPublicValue } from "@/lib/security";

export type InvitationActionState = {
  link?: string;
  expiresAt?: string;
  error?: string;
};

export async function createReferralInvitation(
  _previous: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) return { error: "authentication_required" };

  // Optional private note so the inviter can tell which link went to whom.
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);

  // 16 bytes (128-bit) is ample entropy for a one-use, expiring, rate-limited
  // token, and keeps the shared /i/<token> link short. The hash is used for
  // signup lookup; the raw token is kept in an owner-only secret table so the
  // inviter can re-copy the link later.
  const token = randomBytes(16).toString("base64url");
  const { data, error } = await supabase
    .rpc("create_referral_invitation", {
      p_token: token,
      p_token_hash: hashPublicValue(token),
      p_bound_email_hash: null,
      p_label: label || null,
    })
    .single();

  if (error) {
    console.error("create invitation failed", error.message);
    return {
      error: error.message.includes("limit") ? "active_limit" : "create_failed",
    };
  }

  revalidatePath("/dashboard");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const invitation = data as { expires_at: string };
  return {
    link: `${siteUrl}/i/${token}`,
    expiresAt: String(invitation.expires_at),
  };
}

export async function revokeReferralInvitation(formData: FormData) {
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(invitationId)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_referral_invitation", {
    p_invitation_id: invitationId,
  });
  if (error) console.error("revoke invitation failed", error.message);
  revalidatePath("/dashboard");
  revalidatePath("/admin/invitations");
}

export type InvitationHistoryRow = {
  id: string;
  label: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  usedUid: number | null;
};

// Owner-scoped, paginated history (joined / expired / revoked). Read-only, no
// token — safe to call imperatively from the client for page navigation.
export async function loadInvitationHistory(
  page: number,
): Promise<{ rows: InvitationHistoryRow[]; total: number }> {
  const pageSize = 6;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 0;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "get_my_referral_invitation_history",
    { p_limit: pageSize, p_offset: safePage * pageSize },
  );
  if (error) {
    console.error("load invitation history failed", error.message);
    return { rows: [], total: 0 };
  }
  const list = (data ?? []) as Array<{
    id: string;
    label: string | null;
    status: string;
    expires_at: string;
    created_at: string;
    used_at: string | null;
    used_uid: number | null;
    total_count: number;
  }>;
  return {
    rows: list.map((r) => ({
      id: r.id,
      label: r.label,
      status: r.status,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      usedAt: r.used_at,
      usedUid: r.used_uid,
    })),
    total: Number(list[0]?.total_count ?? 0),
  };
}

export async function updateReferralInvitationLabel(formData: FormData) {
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(invitationId)) return;
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_referral_invitation_label", {
    p_invitation_id: invitationId,
    p_label: label || null,
  });
  if (error) console.error("update invitation label failed", error.message);
  revalidatePath("/dashboard");
}
