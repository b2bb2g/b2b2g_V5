"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { HomepageInput } from "@/app/actions/homepage";

import { audit, requireAdmin } from "@/app/actions/admin/core";

// ---- Member management (D3) ----------------------------------------------
export async function saveMemberMemo(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const memo = String(formData.get("memo") ?? "").trim();

  await supabase.from("member_admin_memos").upsert({
    profile_id: profileId,
    memo,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  await audit(supabase, "member_memo_update", "profile", profileId);
  revalidatePath(`/admin/members/${profileId}`);
}

export async function setMemberStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["active", "suspended"].includes(status)) return;

  await supabase
    .from("profiles")
    .update({
      status,
      suspend_reason: status === "suspended" ? reason || null : null,
    })
    .eq("id", profileId);
  await audit(supabase, `member_${status}`, "profile", profileId, { reason });
  revalidatePath(`/admin/members/${profileId}`);
  revalidatePath("/admin/members");
}

// Bulk member actions (PRD 17.2): notify or retier the selected members.
export async function bulkMemberAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const action = String(formData.get("bulkAction") ?? "");
  if (!ids.length) return;

  if (action === "notify") {
    const message = String(formData.get("message") ?? "").trim();
    if (!message) return;
    await supabase
      .from("notifications")
      .insert(ids.map((id) => ({ profile_id: id, type: "admin_notice", payload: { message } })));
    await audit(supabase, "member_bulk_notify", "profile", "bulk", {
      count: ids.length,
    });
  } else if (action === "tier") {
    const tierId = String(formData.get("tierId") ?? "");
    if (!tierId) return;
    await supabase.from("profiles").update({ tier_id: tierId }).in("id", ids);
    await audit(supabase, "member_bulk_tier", "profile", "bulk", {
      count: ids.length,
      tierId,
    });
  }
  revalidatePath("/admin/members");
  redirect("/admin/members?toast=saved");
}

export async function adminSendPasswordReset(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const { data: contact } = await supabase
    .from("profile_contacts")
    .select("email")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!contact?.email) return;

  await supabase.auth.resetPasswordForEmail(contact.email);
  await audit(supabase, "member_password_reset_sent", "profile", profileId);
  revalidatePath(`/admin/members/${profileId}`);
}

// Withdrawal with anonymization (PRD 17.2): posts stay, identity goes.
export async function withdrawMember(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  await supabase.rpc("withdraw_member", { target: profileId });
  revalidatePath(`/admin/members/${profileId}`);
  revalidatePath("/admin/members");
}

// ---- Menus ---------------------------------------------------------------
export async function toggleMenuFlag(formData: FormData) {
  const { supabase } = await requireAdmin();
  const menuId = String(formData.get("menuId") ?? "");
  const flag = String(formData.get("flag") ?? "");
  const value = String(formData.get("value") ?? "") === "true";

  if (!["is_visible", "member_write", "review_required"].includes(flag)) return;
  await supabase.from("menus").update({ [flag]: value }).eq("id", menuId);
  await audit(supabase, "menu_flag_change", "menu", menuId, { flag, value });
  revalidatePath("/admin/menus");
  revalidatePath("/", "layout");
}

// Reorder menus by swapping sort_order with the neighbour (PRD 17.6).
export async function moveMenu(formData: FormData) {
  const { supabase } = await requireAdmin();
  const menuId = String(formData.get("menuId") ?? "");
  const direction = Number(formData.get("direction") ?? 0);
  if (!menuId || ![-1, 1].includes(direction)) return;

  const { data: menus } = await supabase
    .from("menus")
    .select("id, sort_order")
    .order("sort_order");
  const list = menus ?? [];
  const index = list.findIndex((m) => m.id === menuId);
  const neighbour = list[index + direction];
  if (index < 0 || !neighbour) return;

  await Promise.all([
    supabase.from("menus").update({ sort_order: neighbour.sort_order }).eq("id", menuId),
    supabase.from("menus").update({ sort_order: list[index].sort_order }).eq("id", neighbour.id),
  ]);
  await audit(supabase, "menu_reorder", "menu", menuId, { direction });
  revalidatePath("/admin/menus");
  revalidatePath("/", "layout");
}

export async function createMenu(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleKo = String(formData.get("titleKo") ?? "").trim();
  const boardType = String(formData.get("boardType") ?? "product");
  if (!slug || !titleEn) return;

  const { data: last } = await supabase
    .from("menus")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("menus").insert({
    slug,
    title_en: titleEn,
    title_ko: titleKo || titleEn,
    board_type: boardType,
    sort_order: (last?.sort_order ?? 0) + 1,
    is_visible: false,
  });
  await audit(supabase, "menu_create", "menu", slug, { boardType });
  revalidatePath("/admin/menus");
  revalidatePath("/", "layout");
}

export async function updateMenu(formData: FormData) {
  const { supabase } = await requireAdmin();
  const menuId = String(formData.get("menuId") ?? "");
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleKo = String(formData.get("titleKo") ?? "").trim();
  if (!menuId || !titleEn) return;

  await supabase
    .from("menus")
    .update({ title_en: titleEn, title_ko: titleKo || titleEn })
    .eq("id", menuId);
  await audit(supabase, "menu_update", "menu", menuId, { titleEn, titleKo });
  revalidatePath("/admin/menus");
  revalidatePath("/", "layout");
}

export async function deleteMenu(formData: FormData) {
  const { supabase } = await requireAdmin();
  const menuId = String(formData.get("menuId") ?? "");
  if (!menuId) return;

  // A board with posts cannot be deleted -- hide it instead (data safety).
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("menu_id", menuId);
  if ((count ?? 0) > 0) {
    redirect("/admin/menus?error=has_posts");
  }

  await supabase.from("menus").delete().eq("id", menuId);
  await audit(supabase, "menu_delete", "menu", menuId, {});
  revalidatePath("/admin/menus");
  revalidatePath("/", "layout");
  redirect("/admin/menus?toast=deleted");
}

// ---- Catalog: categories + spec field pool (D10) ---------------------------
// Admin edit of a member's mini homepage (PRD 17.2). Uploads made while
// editing land in the admin's own storage folder; the public bucket serves
// them regardless of folder.
export async function saveHomepageAdmin(
  profileId: string,
  input: HomepageInput
): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();

  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) return { error: "slug" };

  const { error } = await supabase.from("mini_homepages").upsert({
    profile_id: profileId,
    slug,
    intro_en: input.introEn,
    intro_ko: input.introKo || null,
    cover_image_path: input.coverImagePath,
    doc_paths: input.docPaths,
    gallery_paths: input.galleryPaths,
    cert_paths: input.certPaths,
    custom_domain: input.customDomain.trim() || null,
    is_published: input.isPublished,
  });
  if (error) {
    return { error: error.code === "23505" ? "slug_taken" : "save" };
  }
  await audit(supabase, "homepage_admin_update", "mini_homepage", profileId, { slug });
  revalidatePath(`/c/${slug}`);
  revalidatePath(`/admin/members/${profileId}`);
  return {};
}

// ---- Coordinator role (D4) --------------------------------------------------
export async function setCoordinatorRole(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const enable = String(formData.get("enable") ?? "") === "true";

  await supabase
    .from("profiles")
    .update({ is_coordinator: enable })
    .eq("id", profileId);
  await audit(supabase, enable ? "coordinator_grant" : "coordinator_revoke", "profile", profileId);
  revalidatePath("/admin/referrals");
}

// ---- Settings ------------------------------------------------------------
export async function updateSetting(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const key = String(formData.get("key") ?? "");
  const kind = String(formData.get("kind") ?? "string");
  const raw = String(formData.get("value") ?? "");

  let value: unknown = raw;
  if (kind === "boolean") value = raw === "true";
  if (kind === "number") value = Number(raw) || 0;

  await supabase
    .from("site_settings")
    .update({ value, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("key", key);
  await audit(supabase, "setting_change", "site_setting", key, { value });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
