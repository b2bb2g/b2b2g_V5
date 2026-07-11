"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { HomepageInput } from "@/app/actions/homepage";
import {
  BADGE_CODES,
  PERMISSION_ACTIONS,
  SUBSCRIPTION_STATUS,
} from "@/lib/constants";

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

export async function saveBenefit(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleKo = String(formData.get("titleKo") ?? "").trim();
  const bodyEn = String(formData.get("bodyEn") ?? "").trim();
  const bodyKo = String(formData.get("bodyKo") ?? "").trim();
  if (!titleEn) return;

  const row = {
    title_en: titleEn,
    title_ko: titleKo || titleEn,
    body_en: bodyEn,
    body_ko: bodyKo || bodyEn,
  };
  if (id) {
    await supabase.from("benefits").update(row).eq("id", id);
  } else {
    const { data: last } = await supabase
      .from("benefits")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    await supabase
      .from("benefits")
      .insert({ ...row, sort_order: (last?.sort_order ?? 0) + 1 });
  }
  await audit(supabase, id ? "benefit_update" : "benefit_create", "benefit", id || titleEn, {});
  revalidatePath("/admin/subscriptions");
  revalidatePath("/membership");
}

export async function toggleBenefitActive(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const value = String(formData.get("value") ?? "") === "true";
  if (!id) return;
  await supabase.from("benefits").update({ is_active: value }).eq("id", id);
  await audit(supabase, "benefit_toggle", "benefit", id, { value });
  revalidatePath("/admin/subscriptions");
  revalidatePath("/membership");
}

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameKo = String(formData.get("nameKo") ?? "").trim();
  const menuId = String(formData.get("menuId") ?? "");
  if (!nameEn) return;

  if (id) {
    await supabase
      .from("categories")
      .update({ name_en: nameEn, name_ko: nameKo || nameEn })
      .eq("id", id);
  } else {
    const { data: last } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    await supabase.from("categories").insert({
      name_en: nameEn,
      name_ko: nameKo || nameEn,
      menu_id: menuId || null,
      sort_order: (last?.sort_order ?? 0) + 1,
    });
  }
  await audit(supabase, id ? "category_update" : "category_create", "category", id || nameEn);
  revalidatePath("/admin/catalog");
}

export async function toggleCategoryActive(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await supabase.from("categories").update({ is_active: active }).eq("id", id);
  await audit(supabase, "category_toggle", "category", id, { active });
  revalidatePath("/admin/catalog");
}

export async function saveSpecField(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameKo = String(formData.get("nameKo") ?? "").trim();
  if (!nameEn) return;

  if (id) {
    await supabase
      .from("spec_field_defs")
      .update({ name_en: nameEn, name_ko: nameKo || nameEn })
      .eq("id", id);
  } else {
    const { data: last } = await supabase
      .from("spec_field_defs")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    await supabase.from("spec_field_defs").insert({
      name_en: nameEn,
      name_ko: nameKo || nameEn,
      sort_order: (last?.sort_order ?? 0) + 1,
    });
  }
  await audit(supabase, id ? "spec_field_update" : "spec_field_create", "spec_field", id || nameEn);
  revalidatePath("/admin/catalog");
}

export async function toggleSpecFieldActive(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await supabase.from("spec_field_defs").update({ is_active: active }).eq("id", id);
  await audit(supabase, "spec_field_toggle", "spec_field", id, { active });
  revalidatePath("/admin/catalog");
}

// ---- Tiers and permission matrix (D11) -------------------------------------
export async function addTier(formData: FormData) {
  const { supabase } = await requireAdmin();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_");
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameKo = String(formData.get("nameKo") ?? "").trim();
  const isPaid = formData.get("isPaid") === "on";
  if (!code || !nameEn) return;

  const { data: last } = await supabase
    .from("member_tiers")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: tier } = await supabase
    .from("member_tiers")
    .insert({
      code,
      name_en: nameEn,
      name_ko: nameKo || nameEn,
      is_paid: isPaid,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();

  if (tier) {
    await supabase.from("tier_permissions").insert(
      Object.values(PERMISSION_ACTIONS).map((action) => ({
        tier_id: tier.id,
        action,
        allowed: true,
      }))
    );
  }
  await audit(supabase, "tier_create", "tier", code);
  revalidatePath("/admin/tiers");
}

export async function toggleTierPermission(formData: FormData) {
  const { supabase } = await requireAdmin();
  const tierId = String(formData.get("tierId") ?? "");
  const action = String(formData.get("action") ?? "");
  const allowed = String(formData.get("allowed") ?? "") === "true";

  await supabase
    .from("tier_permissions")
    .upsert({ tier_id: tierId, action, allowed }, { onConflict: "tier_id,action" });
  await audit(supabase, "tier_permission_toggle", "tier", tierId, { action, allowed });
  revalidatePath("/admin/tiers");
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

// ---- Subscriptions --------------------------------------------------------
export async function grantSubscription(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const uid = Number(formData.get("uid") ?? 0);
  const days = Number(formData.get("days") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  if (!uid || days <= 0) return;

  const { data: member } = await supabase
    .from("profiles")
    .select("id")
    .eq("uid", uid)
    .maybeSingle();
  if (!member) return;

  const expiresAt = new Date(Date.now() + days * 86400_000).toISOString();
  await supabase.from("subscriptions").insert({
    profile_id: member.id,
    expires_at: expiresAt,
    deposit_note: note || null,
    granted_by: userId,
  });

  // Certified badge accompanies an active subscription (PRD 3.2 + 4).
  const { data: badgeType } = await supabase
    .from("badge_types")
    .select("id")
    .eq("code", BADGE_CODES.CERTIFIED)
    .single();
  if (badgeType) {
    await supabase
      .from("member_badges")
      .upsert(
        { profile_id: member.id, badge_type_id: badgeType.id, granted_by: userId },
        { onConflict: "profile_id,badge_type_id", ignoreDuplicates: true }
      );
  }
  await audit(supabase, "subscription_grant", "profile", member.id, { days, note });
  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions?toast=saved");
}

export async function revokeSubscription(formData: FormData) {
  const { supabase } = await requireAdmin();
  const subscriptionId = String(formData.get("subscriptionId") ?? "");

  const { data: sub } = await supabase
    .from("subscriptions")
    .update({
      status: SUBSCRIPTION_STATUS.REVOKED,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select("profile_id")
    .single();

  if (sub) {
    const { data: badgeType } = await supabase
      .from("badge_types")
      .select("id")
      .eq("code", BADGE_CODES.CERTIFIED)
      .single();
    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", sub.profile_id)
      .eq("status", SUBSCRIPTION_STATUS.ACTIVE);
    if (badgeType && (count ?? 0) === 0) {
      await supabase
        .from("member_badges")
        .delete()
        .eq("profile_id", sub.profile_id)
        .eq("badge_type_id", badgeType.id);
    }
  }
  await audit(supabase, "subscription_revoke", "subscription", subscriptionId);
  revalidatePath("/admin/subscriptions");
}
