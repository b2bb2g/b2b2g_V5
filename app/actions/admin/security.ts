"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/admin/core";

export async function revokeMemberDevice(formData: FormData) {
  const { supabase } = await requireAdmin("security");
  const deviceId = String(formData.get("deviceId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!deviceId) return;
  await supabase.rpc("admin_revoke_member_device", { p_device_id: deviceId }).throwOnError();
  revalidatePath(`/admin/members/${profileId}`);
  revalidatePath("/admin/security");
}
