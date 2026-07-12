"use server";

import { revalidatePath } from "next/cache";
import { PERMISSION_ACTIONS } from "@/lib/constants";
import { audit, requireAdmin } from "@/app/actions/admin/core";

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
    await supabase.from("benefits").update(row).eq("id", id).throwOnError();
  } else {
    const { data: last } = await supabase
      .from("benefits")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    await supabase
      .from("benefits")
      .insert({ ...row, sort_order: (last?.sort_order ?? 0) + 1 })
      .throwOnError();
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
  await supabase.from("benefits").update({ is_active: value }).eq("id", id).throwOnError();
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
      .eq("id", id)
      .throwOnError();
  } else {
    const { data: last } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    await supabase
      .from("categories")
      .insert({
        name_en: nameEn,
        name_ko: nameKo || nameEn,
        menu_id: menuId || null,
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .throwOnError();
  }
  await audit(supabase, id ? "category_update" : "category_create", "category", id || nameEn);
  revalidatePath("/admin/catalog");
}

export async function toggleCategoryActive(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await supabase.from("categories").update({ is_active: active }).eq("id", id).throwOnError();
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
      .eq("id", id)
      .throwOnError();
  } else {
    const { data: last } = await supabase
      .from("spec_field_defs")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    await supabase
      .from("spec_field_defs")
      .insert({
        name_en: nameEn,
        name_ko: nameKo || nameEn,
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .throwOnError();
  }
  await audit(supabase, id ? "spec_field_update" : "spec_field_create", "spec_field", id || nameEn);
  revalidatePath("/admin/catalog");
}

export async function toggleSpecFieldActive(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await supabase.from("spec_field_defs").update({ is_active: active }).eq("id", id).throwOnError();
  await audit(supabase, "spec_field_toggle", "spec_field", id, { active });
  revalidatePath("/admin/catalog");
}

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
  const { data: tier, error } = await supabase
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
  if (error) throw error;

  await supabase
    .from("tier_permissions")
    .insert(
      Object.values(PERMISSION_ACTIONS).map((action) => ({
        tier_id: tier.id,
        action,
        allowed: true,
      })),
    )
    .throwOnError();
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
    .upsert({ tier_id: tierId, action, allowed }, { onConflict: "tier_id,action" })
    .throwOnError();
  await audit(supabase, "tier_permission_toggle", "tier", tierId, { action, allowed });
  revalidatePath("/admin/tiers");
}
