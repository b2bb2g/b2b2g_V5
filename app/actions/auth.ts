"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PW_RESET_COOKIE } from "@/lib/constants";

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const store = await cookies();
  store.delete(PW_RESET_COOKIE);
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
