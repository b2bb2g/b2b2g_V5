"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PERMISSION_ACTIONS } from "@/lib/constants";
import { audit, requireAdmin } from "@/app/actions/admin/core";

export async function saveBenefit(formData: FormData) {
  const { supabase } = await requireAdmin("subscriptions");
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
  const { supabase } = await requireAdmin("subscriptions");
  const id = String(formData.get("id") ?? "");
  const value = String(formData.get("value") ?? "") === "true";
  if (!id) return;
  await supabase.from("benefits").update({ is_active: value }).eq("id", id).throwOnError();
  await audit(supabase, "benefit_toggle", "benefit", id, { value });
  revalidatePath("/admin/subscriptions");
  revalidatePath("/membership");
}

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
  const id = String(formData.get("id") ?? "");
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameKo = String(formData.get("nameKo") ?? "").trim();
  const menuId = String(formData.get("menuId") ?? "");
  const requestedParentId = String(formData.get("parentId") ?? "");
  const parentId = requestedParentId && requestedParentId !== id ? requestedParentId : null;
  if (!nameEn) return;

  let effectiveMenuId: string | null = menuId || null;
  if (parentId) {
    const { data: parent } = await supabase
      .from("categories")
      .select("id, menu_id")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent) redirect("/admin/catalog?error=category_cycle");
    effectiveMenuId = parent.menu_id;

    if (id) {
      const { data: tree } = await supabase.from("categories").select("id, parent_id");
      const parentById = new Map((tree ?? []).map((row) => [row.id, row.parent_id]));
      let cursor: string | null = parentId;
      while (cursor) {
        if (cursor === id) redirect("/admin/catalog?error=category_cycle");
        cursor = parentById.get(cursor) ?? null;
      }
    }
  }

  if (id) {
    await supabase
      .from("categories")
      .update({
        name_en: nameEn,
        name_ko: nameKo || nameEn,
        menu_id: effectiveMenuId,
        parent_id: parentId,
      })
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
        menu_id: effectiveMenuId,
        parent_id: parentId,
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .throwOnError();
  }
  await audit(supabase, id ? "category_update" : "category_create", "category", id || nameEn);
  revalidatePath("/admin/catalog");
}

export async function toggleCategoryActive(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await supabase.from("categories").update({ is_active: active }).eq("id", id).throwOnError();
  await audit(supabase, "category_toggle", "category", id, { active });
  revalidatePath("/admin/catalog");
}

export async function moveCategory(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
  const id = String(formData.get("id") ?? "");
  const direction = Number(formData.get("direction") ?? 0);
  if (!id || ![-1, 1].includes(direction)) return;

  const { data: current } = await supabase
    .from("categories")
    .select("id, menu_id, parent_id")
    .eq("id", id)
    .single();
  if (!current) return;
  let query = supabase.from("categories").select("id, sort_order").order("sort_order");
  query = current.menu_id ? query.eq("menu_id", current.menu_id) : query.is("menu_id", null);
  query = current.parent_id ? query.eq("parent_id", current.parent_id) : query.is("parent_id", null);
  const { data } = await query;
  const list = data ?? [];
  const index = list.findIndex((row) => row.id === id);
  const neighbour = list[index + direction];
  if (index < 0 || !neighbour) return;
  await Promise.all([
    supabase.from("categories").update({ sort_order: neighbour.sort_order }).eq("id", id).throwOnError(),
    supabase.from("categories").update({ sort_order: list[index].sort_order }).eq("id", neighbour.id).throwOnError(),
  ]);
  await audit(supabase, "category_reorder", "category", id, { direction });
  revalidatePath("/admin/catalog");
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { count } = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((count ?? 0) > 0) redirect("/admin/catalog?error=category_used");
  const { count: childCount } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id);
  if ((childCount ?? 0) > 0) redirect("/admin/catalog?error=category_children");
  await supabase.from("categories").delete().eq("id", id).throwOnError();
  await audit(supabase, "category_delete", "category", id);
  revalidatePath("/admin/catalog");
  redirect("/admin/catalog?toast=saved");
}

export async function saveSpecField(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
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
  const { supabase } = await requireAdmin("catalog");
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await supabase.from("spec_field_defs").update({ is_active: active }).eq("id", id).throwOnError();
  await audit(supabase, "spec_field_toggle", "spec_field", id, { active });
  revalidatePath("/admin/catalog");
}

export async function moveSpecField(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
  const id = String(formData.get("id") ?? "");
  const direction = Number(formData.get("direction") ?? 0);
  if (!id || ![-1, 1].includes(direction)) return;
  const { data } = await supabase.from("spec_field_defs").select("id, sort_order").order("sort_order");
  const list = data ?? [];
  const index = list.findIndex((row) => row.id === id);
  const neighbour = list[index + direction];
  if (index < 0 || !neighbour) return;
  await Promise.all([
    supabase.from("spec_field_defs").update({ sort_order: neighbour.sort_order }).eq("id", id).throwOnError(),
    supabase.from("spec_field_defs").update({ sort_order: list[index].sort_order }).eq("id", neighbour.id).throwOnError(),
  ]);
  await audit(supabase, "spec_field_reorder", "spec_field", id, { direction });
  revalidatePath("/admin/catalog");
}

export async function deleteSpecField(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { count } = await supabase.from("post_specs").select("id", { count: "exact", head: true }).eq("field_def_id", id);
  if ((count ?? 0) > 0) redirect("/admin/catalog?error=spec_used");
  await supabase.from("spec_field_defs").delete().eq("id", id).throwOnError();
  await audit(supabase, "spec_field_delete", "spec_field", id);
  revalidatePath("/admin/catalog");
  redirect("/admin/catalog?toast=saved");
}

export async function addTier(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
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

export async function updateTier(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
  const id = String(formData.get("id") ?? "");
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameKo = String(formData.get("nameKo") ?? "").trim();
  const isPaid = formData.get("isPaid") === "on";
  if (!id || !nameEn) return;

  await supabase
    .from("member_tiers")
    .update({ name_en: nameEn, name_ko: nameKo || nameEn, is_paid: isPaid })
    .eq("id", id)
    .throwOnError();
  await audit(supabase, "tier_update", "tier", id, { isPaid });
  revalidatePath("/admin/tiers");
  revalidatePath("/membership");
}

export async function toggleTierPermission(formData: FormData) {
  const { supabase } = await requireAdmin("catalog");
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
