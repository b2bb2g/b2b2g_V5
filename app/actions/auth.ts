"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PW_RESET_COOKIE, SESSION_ONLY_COOKIE } from "@/lib/constants";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const referredByUid = String(formData.get("ref") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
      data: referredByUid ? { referred_by_uid: referredByUid } : undefined,
    },
  });

  if (error) redirect(`/signup?error=1${referredByUid ? `&ref=${referredByUid}` : ""}`);
  redirect("/verify");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const remember = formData.get("remember") === "on";

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);

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

    // Activity history (PRD 17.2): record the login and refresh last-seen.
    const userAgent = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
    await Promise.all([
      supabase
        .from("login_events")
        .insert({ profile_id: data.user.id, user_agent: userAgent }),
      supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", data.user.id),
    ]);
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const store = await cookies();
  store.delete(PW_RESET_COOKIE);
  store.delete(SESSION_ONLY_COOKIE);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reset/update`,
  });
  redirect("/reset?sent=1");
}

export async function updatePassword(formData: FormData) {
  const store = await cookies();
  // Password changes are allowed only inside a recovery-link session.
  if (store.get(PW_RESET_COOKIE)?.value !== "1") redirect("/dashboard");

  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
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
