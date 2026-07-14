"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/app/actions/admin/core";

export async function reviewFeedReport(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const decision = String(formData.get("decision") ?? "dismiss");
  const { supabase, userId } = await requireAdmin("review");

  if (decision === "hide") {
    const { error: postError } = await supabase
      .from("member_feed_posts")
      .update({
        moderation_status: "hidden",
        moderation_note: "Hidden after member report review",
      })
      .eq("id", postId);
    if (postError) redirect("/admin/feed?error=review");
    const { error: reportError } = await supabase
      .from("member_feed_reports")
      .update({
        status: "resolved",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("post_id", postId)
      .eq("status", "pending");
    if (reportError) redirect("/admin/feed?error=review");
  } else {
    const { error } = await supabase
      .from("member_feed_reports")
      .update({
        status: "dismissed",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);
    if (error) redirect("/admin/feed?error=review");
  }

  await audit(supabase, `feed_report_${decision}`, "member_feed_post", postId, { reportId });

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath(`/feed/${postId}`);
  revalidatePath("/admin/feed");
  redirect("/admin/feed?toast=reviewed");
}
