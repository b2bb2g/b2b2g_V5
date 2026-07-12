"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
