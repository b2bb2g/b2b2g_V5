"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminPermission =
  | "overview"
  | "review"
  | "members"
  | "subscriptions"
  | "catalog"
  | "content"
  | "notifications"
  | "security"
  | "settings"
  | "audit"
  | "team";

const ADMIN_PERMISSIONS: AdminPermission[] = [
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

export async function requireAdmin(permission?: AdminPermission) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: owner }, { data: allowed }] = await Promise.all([
    supabase.rpc("is_platform_owner"),
    permission
      ? supabase.rpc("has_admin_permission", { requested: permission })
      : supabase.rpc("has_any_admin_access"),
  ]);
  if (!allowed) redirect("/");

  let permissions: AdminPermission[] = ADMIN_PERMISSIONS;
  if (!owner) {
    const { data: assignment } = await supabase
      .from("admin_staff_assignments")
      .select("permissions")
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    permissions = ((assignment?.permissions ?? []) as string[]).filter(
      (item): item is AdminPermission =>
        ADMIN_PERMISSIONS.includes(item as AdminPermission)
    );
  }

  return {
    supabase,
    userId: user.id,
    isOwner: Boolean(owner),
    permissions,
  };
}

export async function audit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  targetType: string,
  targetId: string,
  detail: Record<string, unknown> = {}
) {
  await supabase.rpc("log_audit", { a_action: action, a_target_type: targetType, a_target_id: targetId, a_detail: detail });
}
