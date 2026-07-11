"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendNotificationEmail } from "@/lib/notify-email";
import { MESSAGE_REVIEW_STATUS, POST_STATUS } from "@/lib/constants";
import { audit, requireAdmin } from "@/app/actions/admin/core";

export async function reviewPost(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const approve = decision === "approve";
  if (!approve && !reason) redirect("/admin/moderation?toast=reasonRequired");
  const { data: post } = await supabase.from("posts").update({ status: approve ? POST_STATUS.APPROVED : POST_STATUS.REJECTED, reviewed_by: userId, reviewed_at: new Date().toISOString(), reject_reason: approve ? null : reason || null }).eq("id", postId).select("author_id, title_en").single();
  if (post) await sendNotificationEmail(supabase, post.author_id, approve ? "post_approved" : "post_rejected", { title: post.title_en, reason });
  await audit(supabase, `post_${decision}`, "post", postId, { reason });
  revalidatePath("/admin/moderation");
  redirect(`/admin/moderation?toast=${approve ? "approved" : "rejected"}`);
}

export async function reviewMessage(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const messageId = String(formData.get("messageId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();
  const forward = decision === "forward";
  if (!forward && !reason) redirect("/admin/inquiries?toast=reasonRequired");
  const { data: message } = await supabase.from("inquiry_messages").update({ review_status: forward ? MESSAGE_REVIEW_STATUS.FORWARDED : MESSAGE_REVIEW_STATUS.REJECTED, reject_reason: forward ? null : reason || null, admin_feedback: feedback || null, reviewed_by: userId, reviewed_at: new Date().toISOString() }).eq("id", messageId).select("sender_id, inquiry_id").single();
  if (message) {
    const { data: inquiry } = await supabase.from("inquiries").select("subject, sender_id, recipient_id").eq("id", message.inquiry_id).single();
    if (inquiry) {
      const target = forward ? (message.sender_id === inquiry.sender_id ? inquiry.recipient_id : inquiry.sender_id) : message.sender_id;
      await sendNotificationEmail(supabase, target, forward ? "message_delivered" : "message_rejected", { title: inquiry.subject, reason });
    }
  }
  await audit(supabase, `message_${decision}`, "inquiry_message", messageId, { reason });
  revalidatePath("/admin/inquiries");
  redirect(`/admin/inquiries?toast=${forward ? "forwarded" : "rejected"}`);
}

export async function reviewBadgeApplication(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const approve = decision === "approve";
  if (!approve && !reason) redirect("/admin/badges?toast=reasonRequired");
  const { data: application } = await supabase.from("badge_applications").update({ status: approve ? "approved" : "rejected", reject_reason: approve ? null : reason || null, reviewed_by: userId, reviewed_at: new Date().toISOString() }).eq("id", applicationId).select("profile_id").single();
  if (application) await sendNotificationEmail(supabase, application.profile_id, approve ? "badge_approved" : "badge_rejected", { reason });
  await audit(supabase, `badge_${decision}`, "badge_application", applicationId, { reason });
  revalidatePath("/admin/badges");
  redirect(`/admin/badges?toast=${approve ? "approved" : "rejected"}`);
}
