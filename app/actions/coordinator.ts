"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Coordinator direct channel (PRD 16.5): the only unreviewed message path.
// RLS enforces the coordinator/direct-referral pairing; admins can read all.
export async function sendCoordinatorMessage(formData: FormData) {
  const coordinatorId = String(formData.get("coordinatorId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const backTo = String(formData.get("backTo") ?? "/dashboard");
  if (!body) redirect(backTo);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("coordinator_messages").insert({
    coordinator_id: coordinatorId,
    member_id: memberId,
    sender_id: user.id,
    body,
  });

  revalidatePath(backTo);
  redirect(backTo.startsWith("/") ? backTo : "/dashboard");
}
