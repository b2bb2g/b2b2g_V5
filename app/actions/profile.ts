"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/constants";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const bioEn = String(formData.get("bioEn") ?? "").trim();
  const bioKo = String(formData.get("bioKo") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const avatarPath = String(formData.get("avatarPath") ?? "").trim();

  const { data: previous } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const safeAvatar = avatarPath.startsWith(`${user.id}/`) ? avatarPath : "";
  const { error } = await supabase.rpc("update_member_profile", {
    p_display_name: displayName,
    p_company_name: companyName,
    p_bio_en: bioEn,
    p_bio_ko: bioKo,
    p_phone: phone,
    p_contact_person: contactPerson,
    p_avatar_path: safeAvatar,
  });
  if (error) redirect("/dashboard/profile/edit?error=save");
  if (previous?.avatar_url && previous.avatar_url !== safeAvatar) {
    await supabase.storage
      .from(STORAGE_BUCKETS.POST_MEDIA)
      .remove([previous.avatar_url]);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/profile?toast=saved");
}

// Self-service withdrawal (PRD 17.2): anonymize and end the session.
export async function withdrawSelf() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.rpc("withdraw_member", { target: user.id });
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
