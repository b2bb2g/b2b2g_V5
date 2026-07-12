"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/constants";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseMedia(
  value: FormDataEntryValue | null,
  userId: string,
): string[] {
  try {
    const paths = JSON.parse(String(value ?? "[]"));
    if (!Array.isArray(paths)) return [];
    return paths
      .filter(
        (path): path is string =>
          typeof path === "string" && path.startsWith(`${userId}/feed-`),
      )
      .slice(0, 10);
  } catch {
    return [];
  }
}

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "/feed");
  return path === "/" || path.startsWith("/feed") || path.startsWith("/u/")
    ? path
    : "/feed";
}

function revalidateFeed(postId: string, returnTo: string) {
  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath(`/feed/${postId}`);
  revalidatePath(returnTo);
}

function withNotice(path: string, key: "toast" | "error", value: string) {
  const url = new URL(path, "https://internal.invalid");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/feed");
  return { supabase, user };
}

export async function createFeedPost(formData: FormData) {
  const { supabase, user } = await currentUser();
  const body = String(formData.get("body") ?? "")
    .trim()
    .slice(0, 2000);
  const mediaPaths = parseMedia(formData.get("mediaPaths"), user.id);
  if (!body) redirect("/feed?error=required");

  const { error } = await supabase.from("member_feed_posts").insert({
    author_id: user.id,
    body,
    media_paths: mediaPaths,
  });
  if (error) redirect("/feed?error=post");
  revalidatePath("/");
  revalidatePath("/feed");
  redirect("/feed?toast=posted");
}

export async function updateFeedPost(formData: FormData) {
  const { supabase, user } = await currentUser();
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "")
    .trim()
    .slice(0, 2000);
  const mediaPaths = parseMedia(formData.get("mediaPaths"), user.id);
  if (!UUID.test(postId) || !body) redirect("/feed?error=required");

  const { data: existing } = await supabase
    .from("member_feed_posts")
    .select("media_paths")
    .eq("id", postId)
    .eq("author_id", user.id)
    .maybeSingle();
  const { error } = await supabase
    .from("member_feed_posts")
    .update({ body, media_paths: mediaPaths })
    .eq("id", postId)
    .eq("author_id", user.id);
  if (error) redirect(`/feed/${postId}/edit?error=save`);
  const removed = ((existing?.media_paths ?? []) as string[]).filter(
    (path) => !mediaPaths.includes(path),
  );
  if (removed.length) {
    await supabase.storage.from(STORAGE_BUCKETS.POST_MEDIA).remove(removed);
  }
  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath(`/feed/${postId}`);
  redirect(`/feed/${postId}?toast=saved`);
}

export async function deleteFeedPost(formData: FormData) {
  const { supabase, user } = await currentUser();
  const postId = String(formData.get("postId") ?? "");
  if (!UUID.test(postId)) redirect("/feed");
  const { data: existing } = await supabase
    .from("member_feed_posts")
    .select("media_paths")
    .eq("id", postId)
    .eq("author_id", user.id)
    .maybeSingle();
  const { error } = await supabase
    .from("member_feed_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);
  if (error) redirect(`/feed/${postId}?error=delete`);
  if (existing?.media_paths?.length) {
    await supabase.storage
      .from(STORAGE_BUCKETS.POST_MEDIA)
      .remove(existing.media_paths);
  }
  revalidatePath("/");
  revalidatePath("/feed");
  redirect("/feed?toast=deleted");
}

export async function toggleFeedLike(formData: FormData) {
  const { supabase, user } = await currentUser();
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!UUID.test(postId)) return;
  const { data: existing } = await supabase
    .from("member_feed_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("member_feed_likes")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
  } else {
    await supabase.from("member_feed_likes").insert({
      post_id: postId,
      profile_id: user.id,
    });
  }
  revalidateFeed(postId, returnTo);
}

export async function createFeedComment(formData: FormData) {
  const { supabase, user } = await currentUser();
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const body = String(formData.get("body") ?? "")
    .trim()
    .slice(0, 800);
  if (!UUID.test(postId) || !body) return;
  const { error } = await supabase.from("member_feed_comments").insert({
    post_id: postId,
    author_id: user.id,
    body,
  });
  if (error) redirect(withNotice(returnTo, "error", "comment"));
  revalidateFeed(postId, returnTo);
}

export async function deleteFeedComment(formData: FormData) {
  const { supabase, user } = await currentUser();
  const commentId = String(formData.get("commentId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!UUID.test(commentId) || !UUID.test(postId)) return;
  await supabase
    .from("member_feed_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);
  revalidateFeed(postId, returnTo);
}

export async function toggleFeedRepost(formData: FormData) {
  const { supabase, user } = await currentUser();
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!UUID.test(postId)) return;
  const { data: existing } = await supabase
    .from("member_feed_reposts")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("member_feed_reposts")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
  } else {
    await supabase.from("member_feed_reposts").insert({
      post_id: postId,
      profile_id: user.id,
    });
  }
  revalidateFeed(postId, returnTo);
}

export async function recordFeedShare(formData: FormData) {
  const { supabase, user } = await currentUser();
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!UUID.test(postId)) return;
  await supabase.from("member_feed_shares").upsert(
    { post_id: postId, profile_id: user.id },
    { onConflict: "post_id,profile_id", ignoreDuplicates: true },
  );
  revalidateFeed(postId, returnTo);
}

export async function toggleMemberFollow(formData: FormData) {
  const { supabase, user } = await currentUser();
  const targetId = String(formData.get("targetId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!UUID.test(targetId) || targetId === user.id) return;
  const { data: existing } = await supabase
    .from("member_follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("member_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
  } else {
    await supabase.from("member_follows").insert({
      follower_id: user.id,
      following_id: targetId,
    });
  }
  revalidatePath(returnTo);
  revalidatePath("/feed");
}

export async function reportFeedPost(formData: FormData) {
  const { supabase, user } = await currentUser();
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const reason = String(formData.get("reason") ?? "other");
  const details = String(formData.get("details") ?? "").trim().slice(0, 500);
  if (!UUID.test(postId)) return;
  if (!["spam", "misleading", "abuse", "other"].includes(reason)) return;
  const { error } = await supabase.from("member_feed_reports").insert({
    post_id: postId,
    reporter_id: user.id,
    reason,
    details: details || null,
  });
  if (error && error.code !== "23505") {
    redirect(withNotice(returnTo, "error", "report"));
  }
  revalidatePath("/admin/feed");
  redirect(withNotice(returnTo, "toast", "reported"));
}

export async function blockFeedMember(formData: FormData) {
  const { supabase, user } = await currentUser();
  const targetId = String(formData.get("targetId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!UUID.test(targetId) || targetId === user.id) return;
  const { error } = await supabase.from("member_blocks").upsert(
    { blocker_id: user.id, blocked_id: targetId },
    { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
  );
  if (error) redirect(withNotice(returnTo, "error", "block"));
  revalidatePath("/feed");
  redirect(withNotice("/feed", "toast", "blocked"));
}
