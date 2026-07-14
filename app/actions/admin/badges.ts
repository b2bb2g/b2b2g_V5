"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/app/actions/admin/core";

const normalizeCode = (value: FormDataEntryValue | null) =>
  String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");

export async function saveBadgeType(formData: FormData) {
  const { supabase } = await requireAdmin("review");
  const id = String(formData.get("id") ?? "");
  const code = normalizeCode(formData.get("code"));
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameKo = String(formData.get("nameKo") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const descriptionKo = String(formData.get("descriptionKo") ?? "").trim();
  if (!code || !nameEn) redirect("/admin/badges?error=invalid");
  const row = { code, name_en: nameEn, name_ko: nameKo || nameEn, description_en: descriptionEn || null, description_ko: descriptionKo || descriptionEn || null };
  if (id) await supabase.from("badge_types").update(row).eq("id", id).throwOnError();
  else {
    const { data: last } = await supabase.from("badge_types").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    await supabase.from("badge_types").insert({ ...row, sort_order: (last?.sort_order ?? 0) + 1 }).throwOnError();
  }
  await audit(supabase, id ? "badge_type_updated" : "badge_type_created", "badge_type", id || code, { code });
  revalidatePath("/admin/badges");
  redirect("/admin/badges?toast=saved");
}

export async function toggleBadgeType(formData: FormData) {
  const { supabase } = await requireAdmin("review");
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive")) === "true";
  await supabase.from("badge_types").update({ is_active: isActive }).eq("id", id).throwOnError();
  await audit(supabase, "badge_type_toggled", "badge_type", id, { isActive });
  revalidatePath("/admin/badges");
}

export async function grantBadgeToUid(formData: FormData) {
  const { supabase, userId } = await requireAdmin("review");
  const uid = Number(formData.get("uid") ?? 0);
  const badgeTypeId = String(formData.get("badgeTypeId") ?? "");
  const { data: profile } = await supabase.from("profiles").select("id").eq("uid", uid).maybeSingle();
  if (!profile || !badgeTypeId) redirect("/admin/badges?error=not_found");
  await supabase.from("member_badges").upsert({ profile_id: profile.id, badge_type_id: badgeTypeId, granted_by: userId }, { onConflict: "profile_id,badge_type_id" }).throwOnError();
  await audit(supabase, "badge_granted", "profile", profile.id, { badgeTypeId, uid });
  revalidatePath("/admin/badges");
  revalidatePath(`/u/${uid}`);
  redirect("/admin/badges?toast=granted");
}

export async function revokeMemberBadge(formData: FormData) {
  const { supabase } = await requireAdmin("review");
  const id = String(formData.get("id") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  await supabase.from("member_badges").delete().eq("id", id).throwOnError();
  await audit(supabase, "badge_revoked", "profile", profileId, { memberBadgeId: id });
  revalidatePath("/admin/badges");
}
