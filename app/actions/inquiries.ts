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

  let recipientId: string | null = null;
  let defaultSubject = "";

  if (postId) {
    const { data: post } = await supabase
      .from("posts")
      .select("id, author_id, title_en")
      .eq("id", postId)
      .maybeSingle();
    if (!post || post.author_id === user.id) redirect("/inquiries");
    recipientId = post.author_id;
    defaultSubject = post.title_en;
  } else if (toProfileId) {
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id, uid")
      .eq("id", toProfileId)
      .maybeSingle();
    if (!recipient || recipient.id === user.id) redirect("/inquiries");
    recipientId = recipient.id;
    defaultSubject = `UID:${recipient.uid}`;
  }
  if (!recipientId) redirect("/inquiries");

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      post_id: postId || null,
      sender_id: user.id,
      recipient_id: recipientId,
      subject: subject || defaultSubject,
    })
    .select("id")
    .single();
  if (error || !inquiry) redirect(`/inquiries/new?${errorTarget}&error=1`);

  await supabase.from("inquiry_messages").insert({
    inquiry_id: inquiry.id,
    sender_id: user.id,
    body,
  });

  revalidatePath("/inquiries");
  redirect(`/inquiries/${inquiry.id}?toast=sent`);
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

  await supabase.from("inquiry_messages").insert({
    inquiry_id: inquiryId,
    sender_id: user.id,
    body,
  });

  revalidatePath(`/inquiries/${inquiryId}`);
  redirect(`/inquiries/${inquiryId}?toast=sent`);
}
