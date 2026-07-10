"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  BADGE_CODES,
  MESSAGE_REVIEW_STATUS,
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

  if (decision === "approve") {
    await supabase
      .from("posts")
      .update({
        status: POST_STATUS.APPROVED,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        reject_reason: null,
      })
      .eq("id", postId);
  } else {
    await supabase
      .from("posts")
      .update({
        status: POST_STATUS.REJECTED,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason || null,
      })
      .eq("id", postId);
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

  await supabase
    .from("inquiry_messages")
    .update({
      review_status:
        decision === "forward"
          ? MESSAGE_REVIEW_STATUS.FORWARDED
          : MESSAGE_REVIEW_STATUS.REJECTED,
      reject_reason: decision === "forward" ? null : reason || null,
      admin_feedback: feedback || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", messageId);

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

  await supabase
    .from("badge_applications")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      reject_reason: decision === "approve" ? null : reason || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  await audit(supabase, `badge_${decision}`, "badge_application", applicationId, {
    reason,
  });
  revalidatePath("/admin/badges");
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
