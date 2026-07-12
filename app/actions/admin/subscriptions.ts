"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BADGE_CODES, SUBSCRIPTION_STATUS } from "@/lib/constants";
import { audit, requireAdmin } from "@/app/actions/admin/core";

export async function grantSubscription(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const uid = Number(formData.get("uid") ?? 0);
  const days = Number(formData.get("days") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  if (!uid || days <= 0) return;

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id")
    .eq("uid", uid)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member) return;

  const expiresAt = new Date(Date.now() + days * 86400_000).toISOString();
  await supabase
    .from("subscriptions")
    .insert({
      profile_id: member.id,
      expires_at: expiresAt,
      deposit_note: note || null,
      granted_by: userId,
    })
    .throwOnError();

  const { data: badgeType, error: badgeError } = await supabase
    .from("badge_types")
    .select("id")
    .eq("code", BADGE_CODES.CERTIFIED)
    .single();
  if (badgeError) throw badgeError;
  await supabase
    .from("member_badges")
    .upsert(
      { profile_id: member.id, badge_type_id: badgeType.id, granted_by: userId },
      { onConflict: "profile_id,badge_type_id", ignoreDuplicates: true },
    )
    .throwOnError();
  await audit(supabase, "subscription_grant", "profile", member.id, { days, note });
  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions?toast=saved");
}

export async function revokeSubscription(formData: FormData) {
  const { supabase } = await requireAdmin();
  const subscriptionId = String(formData.get("subscriptionId") ?? "");

  const { data: sub, error: subscriptionError } = await supabase
    .from("subscriptions")
    .update({
      status: SUBSCRIPTION_STATUS.REVOKED,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select("profile_id")
    .single();
  if (subscriptionError) throw subscriptionError;

  const { data: badgeType, error: badgeError } = await supabase
    .from("badge_types")
    .select("id")
    .eq("code", BADGE_CODES.CERTIFIED)
    .single();
  if (badgeError) throw badgeError;
  const { count, error: countError } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", sub.profile_id)
    .eq("status", SUBSCRIPTION_STATUS.ACTIVE);
  if (countError) throw countError;
  if ((count ?? 0) === 0) {
    await supabase
      .from("member_badges")
      .delete()
      .eq("profile_id", sub.profile_id)
      .eq("badge_type_id", badgeType.id)
      .throwOnError();
  }
  await audit(supabase, "subscription_revoke", "subscription", subscriptionId);
  revalidatePath("/admin/subscriptions");
}
