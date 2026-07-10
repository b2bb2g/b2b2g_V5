"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Creates an inquiry thread plus its first message. The DB trigger moves the
// thread into admin review; nothing reaches the recipient until forwarded.
export async function createInquiry(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/inquiries/new?post=${postId}&error=1`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, title_en")
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.author_id === user.id) redirect("/inquiries");

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      post_id: post.id,
      sender_id: user.id,
      recipient_id: post.author_id,
      subject: subject || post.title_en,
    })
    .select("id")
    .single();
  if (error || !inquiry) redirect(`/inquiries/new?post=${postId}&error=1`);

  await supabase.from("inquiry_messages").insert({
    inquiry_id: inquiry.id,
    sender_id: user.id,
    body,
  });

  revalidatePath("/inquiries");
  redirect(`/inquiries/${inquiry.id}?sent=1`);
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
  redirect(`/inquiries/${inquiryId}?sent=1`);
}
