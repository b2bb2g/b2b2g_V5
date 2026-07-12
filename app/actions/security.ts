"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentDeviceHash } from "@/lib/security";
import { PW_RESET_COOKIE, SESSION_ONLY_COOKIE } from "@/lib/constants";

export async function signOutOtherSessions() {
  const supabase = await createClient();
  const currentHash = await currentDeviceHash();
  await supabase.auth.signOut({ scope: "others" });
  let query = supabase.from("trusted_devices").delete();
  query = currentHash ? query.neq("device_hash", currentHash) : query.not("id", "is", null);
  await query;
  revalidatePath("/dashboard/security");
}

export async function revokeDeviceSession(formData: FormData) {
  const id = String(formData.get("deviceId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { data: device } = await supabase
    .from("trusted_devices")
    .select("current_session_id")
    .eq("id", id)
    .maybeSingle();
  if (device?.current_session_id) {
    await supabase.rpc("revoke_member_session", { p_session_id: device.current_session_id });
  } else {
    await supabase.from("trusted_devices").delete().eq("id", id);
  }
  revalidatePath("/dashboard/security");
}

export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.from("trusted_devices").delete().not("id", "is", null);
  await supabase.auth.signOut({ scope: "global" });
  const store = await cookies();
  store.delete(PW_RESET_COOKIE);
  store.delete(SESSION_ONLY_COOKIE);
  redirect("/login?status=signed_out_everywhere");
}
