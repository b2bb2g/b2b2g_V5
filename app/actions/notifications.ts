"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_STATE } from "@/lib/constants";

export async function markAllRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ state: NOTIFICATION_STATE.READ })
    .eq("profile_id", user.id)
    .eq("state", NOTIFICATION_STATE.UNREAD);
  revalidatePath("/notifications");
}

// Two-step delete: unread/read -> trashed -> deleted (PRD 10.1).
export async function setNotificationState(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const state = String(formData.get("state") ?? "");
  const supabase = await createClient();

  if (state === "delete") {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("state", NOTIFICATION_STATE.TRASHED);
  } else if (
    (Object.values(NOTIFICATION_STATE) as string[]).includes(state)
  ) {
    await supabase.from("notifications").update({ state }).eq("id", id);
  }
  revalidatePath("/notifications");
}
