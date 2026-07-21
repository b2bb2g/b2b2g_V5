"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PENDING_VERIFY_EMAIL_COOKIE, PW_RESET_COOKIE, SESSION_ONLY_COOKIE } from "@/lib/constants";
import { safeInternalPath } from "@/lib/navigation";
import { ensureDeviceIdentity, requestSecurityContext, sessionIdFromJwt } from "@/lib/security";
import { sendSecurityEmail } from "@/lib/security-email";
import { passwordMeetsPolicy } from "@/lib/password-policy";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const invite = String(formData.get("invite") ?? "").trim();
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;
  const inviteQuery = invite ? `&invite=${encodeURIComponent(invite)}` : "";

  // Required legal consents must be given; the marketing opt-in is optional and
  // recorded on the account. The UI gates these too, but re-check server-side.
  const requiredConsent = ["agree_terms", "agree_privacy", "agree_cookies"].every(
    (key) => String(formData.get(key) ?? "") === "1",
  );
  if (!requiredConsent) {
    redirect(`/signup?error=consent${inviteQuery}`);
  }
  const marketingConsent = String(formData.get("marketing_consent") ?? "") === "1";

  if (!passwordMeetsPolicy(password, email)) {
    redirect(`/signup?error=weak${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`);
  }

  const supabase = await createClient();
  const { data: availability, error: availabilityError } = await supabase.rpc(
    "check_signup_email",
    { p_email: email, p_invite_token: invite || null },
  );
  if (availabilityError || availability !== "available") {
    const kind =
      availability === "duplicate"
        ? "duplicate"
        : availability === "rate_limited"
          ? "rate"
          : availability === "invite_required" || availability === "email_mismatch"
            ? "invite"
            : "1";
    redirect(`/signup?error=${kind}${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`);
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
      data: {
        ...(invite ? { invite_token: invite } : {}),
        marketing_consent: marketingConsent,
      },
      captchaToken,
    },
  });

  if (error) {
    // Server log keeps the exact cause; the user sees a mapped message.
    console.error("signUp failed:", error.code, error.message);
    const kind = error.message.toLowerCase().includes("captcha")
      ? "captcha"
      : error.code === "weak_password"
        ? "weak"
        : error.code === "over_email_send_rate_limit"
          ? "rate"
          : "1";
    redirect(`/signup?error=${kind}${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`);
  }
  const store = await cookies();
  store.set(PENDING_VERIFY_EMAIL_COOKIE, email, {
    path: "/verify",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
  redirect("/verify");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const remember = formData.get("remember") === "on";
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;

  const [securityContext, device] = await Promise.all([
    requestSecurityContext(),
    ensureDeviceIdentity(),
  ]);
  const store = await cookies();
  if (remember) {
    store.delete(SESSION_ONLY_COOKIE);
  } else {
    // Marker itself is a session cookie: everything ends with the browser.
    store.set(SESSION_ONLY_COOKIE, "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  const supabase = await createClient({ sessionOnly: !remember });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  if (error) {
    const [{ data: shouldAlert }, { data: alertSetting }] = await Promise.all([
      supabase.rpc("record_login_failure", {
        p_email: email,
        p_ip_hash: securityContext.ipHash,
        p_ip_masked: securityContext.ipMasked,
        p_user_agent: securityContext.userAgent,
        p_country: securityContext.country,
      }),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "suspicious_login_email_alert")
        .maybeSingle(),
    ]);
    if (shouldAlert && alertSetting?.value === true) {
      await sendSecurityEmail({
        to: email,
        kind: "failed_attempts",
        device: securityContext.deviceLabel,
        location: [securityContext.city, securityContext.country].filter(Boolean).join(", "),
        ip: securityContext.ipMasked,
      });
    }
    const kind = error.message.toLowerCase().includes("captcha") ? "captcha" : "1";
    redirect(`/login?error=${kind}&next=${encodeURIComponent(next)}`);
  }

  // Suspended / withdrawn members cannot sign in (PRD 17.2).
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile && profile.status !== "active") {
      await supabase.auth.signOut();
      redirect(`/login?error=restricted&next=${encodeURIComponent(next)}`);
    }

    const sessionId = sessionIdFromJwt(data.session?.access_token);
    const [{ data: knownDevice }, { data: recentLogin }, { data: securitySettings }] = await Promise.all([
      supabase
        .from("trusted_devices")
        .select("id, last_country")
        .eq("profile_id", data.user.id)
        .eq("device_hash", device.hash)
        .maybeSingle(),
      supabase
        .from("login_events")
        .select("country")
        .eq("profile_id", data.user.id)
        .not("country", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["login_session_policy", "new_device_email_alert", "suspicious_login_email_alert"]),
    ]);
    const isNewDevice = !knownDevice;
    const priorCountry = knownDevice?.last_country || recentLogin?.country;
    const countryChanged = Boolean(
      securityContext.country && priorCountry && securityContext.country !== priorCountry,
    );
    const riskLevel = countryChanged ? "high" : isNewDevice ? "notice" : "normal";
    const settingMap = Object.fromEntries((securitySettings ?? []).map((item) => [item.key, item.value]));

    await Promise.all([
      supabase
        .from("login_events")
        .insert({
          profile_id: data.user.id,
          user_agent: securityContext.userAgent,
          session_id: sessionId,
          device_hash: device.hash,
          device_label: securityContext.deviceLabel,
          ip_hash: securityContext.ipHash,
          ip_masked: securityContext.ipMasked,
          country: securityContext.country || null,
          city: securityContext.city || null,
          risk_level: riskLevel,
          is_new_device: isNewDevice,
        }),
      supabase.from("trusted_devices").upsert(
        {
          profile_id: data.user.id,
          device_hash: device.hash,
          label: securityContext.deviceLabel,
          last_ip_hash: securityContext.ipHash,
          last_ip_masked: securityContext.ipMasked,
          last_country: securityContext.country || null,
          current_session_id: sessionId,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,device_hash" },
      ),
      supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", data.user.id),
    ]);

    if (settingMap.login_session_policy === "single") {
      await supabase.auth.signOut({ scope: "others" });
    }
    if (isNewDevice && settingMap.new_device_email_alert === true) {
      await sendSecurityEmail({
        to: email,
        kind: "new_device",
        device: securityContext.deviceLabel,
        location: [securityContext.city, securityContext.country].filter(Boolean).join(", "),
        ip: securityContext.ipMasked,
      });
    }
    if (countryChanged && settingMap.suspicious_login_email_alert === true) {
      await sendSecurityEmail({
        to: email,
        kind: "suspicious_signin",
        device: securityContext.deviceLabel,
        location: [securityContext.city, securityContext.country].filter(Boolean).join(", "),
        ip: securityContext.ipMasked,
      });
    }
  }

  revalidatePath("/", "layout");
  redirect(safeInternalPath(next));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const store = await cookies();
  store.delete(PW_RESET_COOKIE);
  store.delete(SESSION_ONLY_COOKIE);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reset/update`,
    captchaToken,
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("captcha")) redirect("/reset?error=captcha");
    if (message.includes("rate") || error.status === 429) redirect("/reset?error=rate");
  }
  redirect("/reset?sent=1");
}

export async function resendVerification(formData: FormData) {
  const store = await cookies();
  const email = store.get(PENDING_VERIFY_EMAIL_COOKIE)?.value;
  if (!email) redirect("/signup");
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
      captchaToken,
    },
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("captcha")) redirect("/verify?error=captcha");
    redirect("/verify?error=rate");
  }
  redirect("/verify?sent=1");
}

export async function updatePassword(formData: FormData) {
  const store = await cookies();
  // Password changes are allowed only inside a recovery-link session.
  if (store.get(PW_RESET_COOKIE)?.value !== "1") redirect("/dashboard");

  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!passwordMeetsPolicy(password, userData.user?.email ?? "")) {
    redirect("/reset/update?error=weak");
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const reason =
      error.code === "same_password"
        ? "same"
        : error.code === "weak_password"
          ? "weak"
          : "1";
    redirect(`/reset/update?error=${reason}`);
  }
  store.delete(PW_RESET_COOKIE);
  redirect("/dashboard");
}
