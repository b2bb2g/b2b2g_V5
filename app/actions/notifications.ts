"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_STATE } from "@/lib/constants";

// Opening a notification IS reading it (messenger convention): the whole
// group flips to read, then the browser continues to the target.
export async function openNotification(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const href = String(formData.get("href") ?? "");
  let ids = [id].filter(Boolean);
  try {
    const parsed = JSON.parse(String(formData.get("ids") ?? "[]"));
    if (Array.isArray(parsed) && parsed.length) {
      ids = [
        ...new Set([...ids, ...parsed.filter((v) => typeof v === "string")]),
      ];
    }
  } catch {
    // Single-id fallback.
  }
  if (ids.length) {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .update({ state: NOTIFICATION_STATE.READ })
      .in("id", ids)
      .eq("state", NOTIFICATION_STATE.UNREAD);
    revalidatePath("/notifications");
  }
  redirect(href.startsWith("/") ? href : "/notifications");
}

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

  // Grouped rows act on every member of the group at once (RLS keeps the
  // update inside the caller's own rows regardless of what ids arrive).
  let ids = [id].filter(Boolean);
  try {
    const parsed = JSON.parse(String(formData.get("ids") ?? "[]"));
    if (Array.isArray(parsed) && parsed.length) {
      ids = [...new Set([...ids, ...parsed.filter((v) => typeof v === "string")])];
    }
  } catch {
    // Single-id fallback.
  }
  if (!ids.length) return;
  const supabase = await createClient();

  if (state === "delete") {
    await supabase
      .from("notifications")
      .delete()
      .in("id", ids)
      .eq("state", NOTIFICATION_STATE.TRASHED);
  } else if (
    (Object.values(NOTIFICATION_STATE) as string[]).includes(state)
  ) {
    await supabase.from("notifications").update({ state }).in("id", ids);
  }
  revalidatePath("/notifications");
}
