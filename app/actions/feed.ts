"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listFeed, type FeedItem } from "@/lib/data/feed";
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
  const parentIdRaw = String(formData.get("parentId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const body = String(formData.get("body") ?? "")
    .trim()
    .slice(0, 800);
  const mediaPaths = parseMedia(formData.get("media"), user.id).slice(0, 2);
  if (!UUID.test(postId) || (!body && mediaPaths.length === 0)) return;

  let parentId: string | null = null;
  if (parentIdRaw) {
    if (!UUID.test(parentIdRaw)) return;
    // Replies stay one level deep and inside the same post.
    const { data: parent } = await supabase
      .from("member_feed_comments")
      .select("id, post_id, parent_id")
      .eq("id", parentIdRaw)
      .maybeSingle();
    if (!parent || parent.post_id !== postId) return;
    parentId = parent.parent_id ?? parent.id;
  }

  const { error } = await supabase.from("member_feed_comments").insert({
    post_id: postId,
    author_id: user.id,
    parent_id: parentId,
    body: body || " ",
    media_paths: mediaPaths,
  });
  if (error) redirect(withNotice(returnTo, "error", "comment"));
  revalidateFeed(postId, returnTo);
}

export async function updateFeedComment(formData: FormData) {
  const { supabase, user } = await currentUser();
  const commentId = String(formData.get("commentId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const body = String(formData.get("body") ?? "")
    .trim()
    .slice(0, 800);
  if (!UUID.test(commentId) || !UUID.test(postId) || !body) return;
  await supabase
    .from("member_feed_comments")
    .update({ body })
    .eq("id", commentId)
    .eq("author_id", user.id);
  revalidateFeed(postId, returnTo);
}

export async function reportFeedComment(formData: FormData) {
  const { supabase, user } = await currentUser();
  const commentId = String(formData.get("commentId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!UUID.test(commentId) || !UUID.test(postId)) return;
  const { error } = await supabase.from("member_feed_comment_reports").insert({
    comment_id: commentId,
    reporter_id: user.id,
    reason: "other",
  });
  // Duplicate report from the same member is a silent success.
  if (error && error.code !== "23505") {
    redirect(withNotice(returnTo, "error", "report"));
  }
  revalidatePath("/admin/feed");
  redirect(withNotice(returnTo, "toast", "reported"));
}

export async function toggleFeedCommentLike(formData: FormData) {
  const { supabase, user } = await currentUser();
  const commentId = String(formData.get("commentId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!UUID.test(commentId) || !UUID.test(postId)) return;
  const { data: existing } = await supabase
    .from("member_feed_comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("member_feed_comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("profile_id", user.id);
  } else {
    await supabase.from("member_feed_comment_likes").insert({
      comment_id: commentId,
      profile_id: user.id,
    });
  }
  revalidateFeed(postId, returnTo);
}

// Unique-viewer tracking; refreshed timestamp on revisit.
export async function recordFeedView(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !UUID.test(String(postId))) return;
  await supabase.from("member_feed_post_views").upsert(
    { post_id: postId, profile_id: user.id, viewed_at: new Date().toISOString() },
    { onConflict: "post_id,profile_id" },
  );
}

// Likers and viewers with identity, for the post author and admins only.
export async function listFeedEngagement(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !UUID.test(String(postId))) return null;
  const [{ data: post }, { data: me }] = await Promise.all([
    supabase
      .from("member_feed_posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
  ]);
  if (!post) return null;
  if (post.author_id !== user.id && !me?.is_admin) return null;

  const [{ data: likers }, { data: viewers }] = await Promise.all([
    supabase
      .from("member_feed_likes")
      .select("created_at, profiles!member_feed_likes_profile_id_fkey!inner(uid, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("member_feed_post_views")
      .select("viewed_at, profiles!member_feed_post_views_profile_id_fkey!inner(uid, avatar_url)")
      .eq("post_id", postId)
      .order("viewed_at", { ascending: false })
      .limit(100),
  ]);
  const identity = (row: unknown) => {
    const profile = (row as { profiles: { uid: number; avatar_url: string | null } }).profiles;
    return { uid: profile.uid, avatarPath: profile.avatar_url };
  };
  return {
    likers: (likers ?? []).map(identity),
    viewers: (viewers ?? []).map(identity),
  };
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

// Cursor pagination for the infinite feed stream.
export async function loadMoreFeed(
  before: string,
  followingOnly = false,
  tag = "",
): Promise<FeedItem[]> {
  if (typeof before !== "string" || Number.isNaN(Date.parse(before))) {
    return [];
  }
  return listFeed({
    limit: 12,
    before,
    followingOnly: followingOnly === true,
    tag: typeof tag === "string" ? tag : "",
  });
}
