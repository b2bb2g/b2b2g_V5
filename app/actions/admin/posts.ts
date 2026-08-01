"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendNotificationEmail } from "@/lib/notify-email";
import {
  MENU_SLUG_PATTERN,
  POST_STATUS,
  STORAGE_BUCKETS,
  UUID_PATTERN,
} from "@/lib/constants";
import { audit, requireAdmin } from "@/app/actions/admin/core";

// Inline post moderation from the public detail page (PRD 17 convenience):
// approve / put back on hold without a trip to the moderation queue. The
// queue screen remains the place for rejections, which require a reason.
export async function moderatePostInline(formData: FormData) {
  const { supabase, userId } = await requireAdmin("review");
  const postId = String(formData.get("postId") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!UUID_PATTERN.test(postId) || !MENU_SLUG_PATTERN.test(menuSlug)) {
    redirect("/admin/moderation?toast=actionFailed");
  }
  const detailPath = `/${menuSlug}/${postId}`;
  const approve = decision === "approve";
  if (!approve && decision !== "hold") redirect(`${detailPath}?toast=actionFailed`);

  const { data: post, error } = await supabase
    .from("posts")
    .update({
      // Hold sends the post back to the review queue; it disappears from the
      // public views (which only serve approved/closed) but nothing is lost.
      status: approve ? POST_STATUS.APPROVED : POST_STATUS.PENDING,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      ...(approve ? { reject_reason: null } : {}),
    })
    .eq("id", postId)
    .select("author_id, title_en")
    .single();
  if (error || !post) {
    console.error("[admin/posts] moderatePostInline update failed", error);
    redirect(`${detailPath}?toast=actionFailed`);
  }
  if (approve) {
    await sendNotificationEmail(supabase, post.author_id, "post_approved", {
      title: post.title_en,
    });
  }
  await audit(supabase, approve ? "post_approve" : "post_hold", "post", postId, {
    source: "detail",
  });
  revalidatePath(`/${menuSlug}`);
  revalidatePath(detailPath);
  revalidatePath("/admin/moderation");
  redirect(`${detailPath}?toast=${approve ? "approved" : "held"}`);
}

// Full removal from the public detail page. Authorization is the RLS delete
// policy (author or content permission); the row delete cascades to specs,
// media and attachment rows. Storage file removal then runs with the service
// role: staff may delete a post they do not own, but the storage policies
// only let the file owner (or the platform owner) remove objects, and an
// orphaned file would linger forever.
export async function adminDeletePost(formData: FormData) {
  const { supabase } = await requireAdmin("content");
  const postId = String(formData.get("postId") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");
  if (!UUID_PATTERN.test(postId) || !MENU_SLUG_PATTERN.test(menuSlug)) {
    redirect("/admin/moderation?toast=actionFailed");
  }

  const [media, attachments] = await Promise.all([
    supabase.from("post_media").select("path").eq("post_id", postId),
    supabase.from("post_attachments").select("path").eq("post_id", postId),
  ]);
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    console.error("[admin/posts] adminDeletePost delete failed", error);
    redirect(`/${menuSlug}/${postId}?toast=actionFailed`);
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const storageClient =
    serviceKey && supabaseUrl
      ? createSupabaseClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : supabase;
  await Promise.all([
    media.data?.length
      ? storageClient.storage
          .from(STORAGE_BUCKETS.POST_MEDIA)
          .remove(media.data.map((item) => item.path))
      : Promise.resolve(),
    attachments.data?.length
      ? storageClient.storage
          .from(STORAGE_BUCKETS.ATTACHMENTS)
          .remove(attachments.data.map((item) => item.path))
      : Promise.resolve(),
  ]);

  await audit(supabase, "post_delete", "post", postId, { source: "detail" });
  revalidatePath(`/${menuSlug}`);
  revalidatePath("/admin/moderation");
  redirect(`/${menuSlug}?toast=deleted`);
}
