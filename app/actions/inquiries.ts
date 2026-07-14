"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_STATE } from "@/lib/constants";

// Creates an inquiry thread plus its first message. The DB trigger moves the
// thread into admin review; nothing reaches the recipient until forwarded.
// Two entry points: about a post (postId) or about a company (toProfileId,
// used by mini homepages, PRD 5.2).
export async function createInquiry(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const toProfileId = String(formData.get("toProfileId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const errorTarget = postId ? `post=${postId}` : `to=${toProfileId}`;
  if (!body) redirect(`/inquiries/new?${errorTarget}&error=1`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inquiryId, error } = await supabase.rpc(
    "create_inquiry_with_message",
    {
      p_post_id: postId || null,
      p_to_profile_id: toProfileId || null,
      p_subject: subject,
      p_body: body,
    },
  );
  if (error || !inquiryId) {
    redirect(`/inquiries/new?${errorTarget}&error=1`);
  }

  revalidatePath("/inquiries");
  redirect(`/inquiries/${inquiryId}?toast=sent`);
}

// Opening an inquiry counts as reading its delivered/returned notifications.
// Triggered from the client (not during the server render) so link prefetching
// never clears the badge before the member actually views the thread.
export async function markInquiryRead(inquiryId: string) {
  if (!inquiryId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { count } = await supabase
    .from("notifications")
    .update({ state: NOTIFICATION_STATE.READ }, { count: "exact" })
    .eq("profile_id", user.id)
    .eq("state", NOTIFICATION_STATE.UNREAD)
    .in("type", ["message_delivered", "message_rejected"])
    .eq("payload->>inquiry_id", inquiryId);

  // Nothing changed -> skip revalidation so a re-view doesn't refetch the shell.
  if (!count) return;
  // Badges live in the member-area layout (dashboard, inquiries, notifications).
  revalidatePath("/inquiries", "layout");
  revalidatePath("/notifications", "layout");
  revalidatePath("/dashboard", "layout");
}

export async function replyInquiry(formData: FormData) {
  const inquiryId = String(formData.get("inquiryId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/inquiries/${inquiryId}?error=1`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("inquiry_messages").insert({
    inquiry_id: inquiryId,
    sender_id: user.id,
    body,
  });
  if (error) redirect(`/inquiries/${inquiryId}?error=1`);

  revalidatePath(`/inquiries/${inquiryId}`);
  redirect(`/inquiries/${inquiryId}?toast=sent`);
}
