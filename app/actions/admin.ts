"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/notify-email";
import {
  BADGE_CODES,
  MESSAGE_REVIEW_STATUS,
  PERMISSION_ACTIONS,
  POST_STATUS,
  SUBSCRIPTION_STATUS,
} from "@/lib/constants";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");
  return { supabase, userId: user.id };
}

async function audit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  targetType: string,
  targetId: string,
  detail: Record<string, unknown> = {}
) {
  await supabase.rpc("log_audit", {
    a_action: action,
    a_target_type: targetType,
    a_target_id: targetId,
    a_detail: detail,
  });
}

// ---- Post review queue -------------------------------------------------
export async function reviewPost(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const approve = decision === "approve";
  const { data: post } = await supabase
    .from("posts")
    .update({
      status: approve ? POST_STATUS.APPROVED : POST_STATUS.REJECTED,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      reject_reason: approve ? null : reason || null,
    })
    .eq("id", postId)
    .select("author_id, title_en")
    .single();

  if (post) {
    await sendNotificationEmail(
      supabase,
      post.author_id,
      approve ? "post_approved" : "post_rejected",
      { title: post.title_en, reason }
    );
  }
  await audit(supabase, `post_${decision}`, "post", postId, { reason });
  revalidatePath("/admin/moderation");
}

// ---- Inquiry message review queue --------------------------------------
export async function reviewMessage(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const messageId = String(formData.get("messageId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();

  const forward = decision === "forward";
  const { data: message } = await supabase
    .from("inquiry_messages")
    .update({
      review_status: forward
        ? MESSAGE_REVIEW_STATUS.FORWARDED
        : MESSAGE_REVIEW_STATUS.REJECTED,
      reject_reason: forward ? null : reason || null,
      admin_feedback: feedback || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .select("sender_id, inquiry_id")
    .single();

  if (message) {
    const { data: inquiry } = await supabase
      .from("inquiries")
      .select("subject, sender_id, recipient_id")
      .eq("id", message.inquiry_id)
      .single();
    if (inquiry) {
      if (forward) {
        const other =
          message.sender_id === inquiry.sender_id
            ? inquiry.recipient_id
            : inquiry.sender_id;
        await sendNotificationEmail(supabase, other, "message_delivered", {
          title: inquiry.subject,
        });
      } else {
        await sendNotificationEmail(supabase, message.sender_id, "message_rejected", {
          title: inquiry.subject,
          reason,
        });
      }
    }
  }

  await audit(supabase, `message_${decision}`, "inquiry_message", messageId, {
    reason,
  });
  revalidatePath("/admin/inquiries");
}

// ---- Badge applications -------------------------------------------------
export async function reviewBadgeApplication(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const approve = decision === "approve";
  const { data: application } = await supabase
    .from("badge_applications")
    .update({
      status: approve ? "approved" : "rejected",
      reject_reason: approve ? null : reason || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .select("profile_id")
    .single();

  if (application) {
    await sendNotificationEmail(
      supabase,
      application.profile_id,
      approve ? "badge_approved" : "badge_rejected",
      { reason }
    );
  }
  await audit(supabase, `badge_${decision}`, "badge_application", applicationId, {
    reason,
  });
  revalidatePath("/admin/badges");
}

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

// ---- Catalog: categories + spec field pool (D10) ---------------------------
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
