"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewFeedReport(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const decision = String(formData.get("decision") ?? "dismiss");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/feed");
  const { data: admin } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin?.is_admin) redirect("/");

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
        reviewed_by: user.id,
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
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);
    if (error) redirect("/admin/feed?error=review");
  }

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath(`/feed/${postId}`);
  revalidatePath("/admin/feed");
  redirect("/admin/feed?toast=reviewed");
}
