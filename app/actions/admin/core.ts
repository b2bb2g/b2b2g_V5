"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");
  return { supabase, userId: user.id };
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
