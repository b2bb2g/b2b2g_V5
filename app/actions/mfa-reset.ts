"use server";

import { createHash, randomInt } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

// Lost-authenticator recovery (phone swap, deleted app): the signed-in
// member proves control of their email with a 6-digit code, then the
// service role removes the stranded TOTP factors so a new device can
// enroll. Codes live 10 minutes, hashed with the security pepper, one
// request per 5 minutes.
const CODE_TTL_MS = 10 * 60 * 1000;
const REQUEST_GAP_MS = 5 * 60 * 1000;

function hashCode(code: string): string {
  return createHash("sha256")
    .update(`${code}:${process.env.SECURITY_HASH_PEPPER ?? ""}`)
    .digest("hex");
}

function serviceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return null;
  return createServiceClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requestMfaReset(): Promise<{
  ok: boolean;
  reason?: "throttled" | "no_email" | "unavailable";
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unavailable" };
  const admin = serviceClient();
  if (!admin) return { ok: false, reason: "unavailable" };

  const { data: existing } = await admin
    .from("mfa_reset_codes")
    .select("created_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (
    existing &&
    Date.now() - new Date(existing.created_at).getTime() < REQUEST_GAP_MS
  ) {
    return { ok: false, reason: "throttled" };
  }

  const email = user.email;
  if (!email) return { ok: false, reason: "no_email" };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await admin.from("mfa_reset_codes").upsert({
    profile_id: user.id,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    created_at: new Date().toISOString(),
  });
  if (error) return { ok: false, reason: "unavailable" };

  const { sent } = await sendEmail({
    to: email,
    subject: `B2BB2G 인증 재설정 코드 ${code}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:460px"><h2 style="margin:0 0 10px">OTP 인증 재설정</h2><p style="margin:0 0 14px;color:#5b6472">아래 코드를 입력하면 기존 인증기 등록이 해제되고 새 기기를 등록할 수 있습니다. 10분간 유효합니다.<br/>Enter this code to remove your lost authenticator and enroll a new device. Valid for 10 minutes.</p><p style="font-size:30px;font-weight:800;letter-spacing:.3em;margin:0">${code}</p><p style="margin:16px 0 0;color:#8a93a1;font-size:12px">본인이 요청하지 않았다면 이 메일을 무시하세요. If you did not request this, ignore this email.</p></div>`,
  });
  if (!sent) {
    await admin.from("mfa_reset_codes").delete().eq("profile_id", user.id);
    return { ok: false, reason: "unavailable" };
  }
  return { ok: true };
}

export async function confirmMfaReset(
  code: string,
): Promise<{ ok: boolean; reason?: "invalid" | "unavailable" }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unavailable" };
  const admin = serviceClient();
  if (!admin) return { ok: false, reason: "unavailable" };

  const cleaned = String(code ?? "").replace(/\D/g, "");
  if (cleaned.length !== 6) return { ok: false, reason: "invalid" };

  const { data: row } = await admin
    .from("mfa_reset_codes")
    .select("code_hash, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (
    !row ||
    row.code_hash !== hashCode(cleaned) ||
    new Date(row.expires_at).getTime() < Date.now()
  ) {
    return { ok: false, reason: "invalid" };
  }

  const { data: factors } = await admin.auth.admin.mfa.listFactors({
    userId: user.id,
  });
  for (const factor of factors?.factors ?? []) {
    if (factor.factor_type !== "totp") continue;
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
  }
  // Single use, and the member gets an in-app trace of the security event.
  await admin.from("mfa_reset_codes").delete().eq("profile_id", user.id);
  await admin.from("notifications").insert({
    profile_id: user.id,
    type: "admin_notice",
    payload: {
      message:
        "OTP 인증이 재설정되었습니다. 새 기기를 등록해 주세요. / Your authenticator was reset - enroll a new device.",
    },
  });
  return { ok: true };
}
