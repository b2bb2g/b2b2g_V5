"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin, type AdminPermission } from "@/app/actions/admin/core";
import { STORAGE_BUCKETS } from "@/lib/constants";

const KNOWN_PERMISSIONS: AdminPermission[] = [
  "overview",
  "review",
  "members",
  "subscriptions",
  "catalog",
  "content",
  "notifications",
  "security",
  "settings",
  "audit",
  "team",
];

const ROLE_DEFAULTS: Record<string, AdminPermission[]> = {
  manager: KNOWN_PERMISSIONS.filter((permission) => permission !== "team"),
  reviewer: ["overview", "review"],
  support: ["overview", "members", "subscriptions", "notifications", "security"],
  content: ["overview", "catalog", "content"],
};

export async function saveStaffAssignment(formData: FormData) {
  const { supabase, userId, isOwner } = await requireAdmin("team");
  if (!isOwner) redirect("/admin/team?error=owner_required");

  const uid = Number(formData.get("uid") ?? 0);
  const role = String(formData.get("role") ?? "reviewer");
  const submitted = formData.getAll("permissions").map(String);
  const permissions = submitted.length
    ? KNOWN_PERMISSIONS.filter((permission) => submitted.includes(permission))
    : (ROLE_DEFAULTS[role] ?? ROLE_DEFAULTS.reviewer);
  if (!uid || !Object.hasOwn(ROLE_DEFAULTS, role)) redirect("/admin/team?error=invalid");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("uid", uid)
    .maybeSingle();
  if (!profile || profile.is_admin) redirect("/admin/team?error=not_found");

  await supabase
    .from("admin_staff_assignments")
    .upsert({
      profile_id: profile.id,
      role,
      permissions,
      is_active: true,
      granted_by: userId,
    })
    .throwOnError();
  await audit(supabase, "staff_assignment_saved", "profile", profile.id, { role, permissions });
  revalidatePath("/admin", "layout");
  redirect("/admin/team?toast=saved");
}

export async function toggleStaffAssignment(formData: FormData) {
  const { supabase, isOwner } = await requireAdmin("team");
  if (!isOwner) redirect("/admin/team?error=owner_required");
  const profileId = String(formData.get("profileId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";
  if (!profileId) redirect("/admin/team?error=invalid");

  await supabase
    .from("admin_staff_assignments")
    .update({ is_active: isActive })
    .eq("profile_id", profileId)
    .throwOnError();
  await audit(supabase, isActive ? "staff_access_enabled" : "staff_access_disabled", "profile", profileId);
  revalidatePath("/admin", "layout");
  redirect("/admin/team?toast=saved");
}

export async function updateOperationsSetting(formData: FormData) {
  const permission = String(formData.get("permission") ?? "settings") as AdminPermission;
  if (!KNOWN_PERMISSIONS.includes(permission)) redirect("/admin/settings?error=invalid");
  const { supabase, userId } = await requireAdmin(permission);
  const key = String(formData.get("key") ?? "");
  const kind = String(formData.get("kind") ?? "string");
  const raw = String(formData.get("value") ?? "");
  const allowedPrefixes: Record<string, string[]> = {
    notifications: ["email_notify_", "subscription_expiry_notice_days", "admin_digest_hour"],
    security: ["login_session_policy", "new_device_email_alert", "suspicious_login_email_alert", "failed_login_threshold", "security_log_retention_days"],
    content: ["site_", "seo_", "robots_", "google_", "naver_", "cookie_banner_"],
    settings: ["pwa_", "inapp_", "upload_", "translation_", "video_", "category_", "featured_", "free_post_", "referral_", "signup_", "coordinator_", "admin_queue_"],
  };
  if (!(allowedPrefixes[permission] ?? []).some((prefix) => key.startsWith(prefix))) {
    redirect(`/admin/${permission === "content" ? "content" : permission}?error=invalid`);
  }
  let value: string | number | boolean = raw;
  if (kind === "boolean") value = raw === "true";
  if (kind === "number") value = Number(raw) || 0;

  await supabase
    .from("site_settings")
    .update({ value, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("key", key)
    .throwOnError();
  await audit(supabase, "operations_setting_change", "site_setting", key, { value, permission });
  revalidatePath("/admin", "layout");
}

export async function uploadSiteAsset(formData: FormData) {
  const { supabase, userId } = await requireAdmin("content");
  const key = String(formData.get("key") ?? "");
  const file = formData.get("file");
  if (key !== "site_og_image" || !(file instanceof File) || file.size === 0) {
    redirect("/admin/content?error=invalid_asset");
  }
  if (file.size > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
    redirect("/admin/content?error=invalid_asset");
  }
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  const path = `branding/${userId}/${crypto.randomUUID()}.${extension}`;
  const { data: previous } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  await supabase.storage.from(STORAGE_BUCKETS.SITE_ASSETS).upload(path, file, { contentType: file.type, upsert: false }).then(({ error }) => {
    if (error) throw error;
  });
  const { data } = supabase.storage.from(STORAGE_BUCKETS.SITE_ASSETS).getPublicUrl(path);
  await supabase.from("site_settings").update({ value: data.publicUrl, updated_by: userId, updated_at: new Date().toISOString() }).eq("key", key).throwOnError();
  if (typeof previous?.value === "string" && previous.value.includes(`/${STORAGE_BUCKETS.SITE_ASSETS}/`)) {
    const previousPath = previous.value.split(`/${STORAGE_BUCKETS.SITE_ASSETS}/`)[1]?.split("?")[0];
    if (previousPath && previousPath !== path) {
      await supabase.storage.from(STORAGE_BUCKETS.SITE_ASSETS).remove([decodeURIComponent(previousPath)]);
    }
  }
  await audit(supabase, "site_asset_uploaded", "site_setting", key, { path });
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
  redirect("/admin/content?toast=saved");
}
