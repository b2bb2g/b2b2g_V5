import "server-only";
import { createClient } from "@/lib/supabase/server";

export type FeedItem = {
  id: string;
  authorId: string;
  authorUid: number;
  avatarPath: string | null;
  body: string;
  mediaPaths: string[];
  createdAt: string;
  likeCount: number;
  likedByViewer: boolean;
  commentCount: number;
  repostCount: number;
  repostedByViewer: boolean;
  shareCount: number;
  followingAuthor: boolean;
};

export type FeedComment = {
  id: string;
  parentId: string | null;
  edited: boolean;
  authorId: string;
  authorUid: number;
  avatarPath: string | null;
  body: string;
  mediaPaths: string[];
  createdAt: string;
  likeCount: number;
  likedByViewer: boolean;
  replyCount: number;
};

export type MemberNetworkStats = {
  posts: number;
  followers: number;
  following: number;
};

type RawFeedPost = {
  id: string;
  author_id: string;
  body: string;
  media_paths: string[] | null;
  created_at: string;
  profiles: unknown;
};

async function hydrateFeedItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  posts: RawFeedPost[],
): Promise<FeedItem[]> {
  if (!posts.length) return [];
  const postIds = posts.map((post) => post.id);
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const userResult = await supabase.auth.getUser();
  const viewerId = userResult.data.user?.id ?? null;
  const [
    likesResult,
    commentsResult,
    repostsResult,
    sharesResult,
    followsResult,
  ] = await Promise.all([
    supabase
      .from("member_feed_likes")
      .select("post_id, profile_id")
      .in("post_id", postIds),
    supabase
      .from("member_feed_comments")
      .select("post_id")
      .in("post_id", postIds),
    supabase
      .from("member_feed_reposts")
      .select("post_id, profile_id")
      .in("post_id", postIds),
    supabase
      .from("member_feed_shares")
      .select("post_id")
      .in("post_id", postIds),
    viewerId
      ? supabase
          .from("member_follows")
          .select("following_id")
          .eq("follower_id", viewerId)
          .in("following_id", authorIds)
      : Promise.resolve({ data: [] as { following_id: string }[] }),
  ]);
  const likes = likesResult.data ?? [];
  const comments = commentsResult.data ?? [];
  const reposts = repostsResult.data ?? [];
  const shares = sharesResult.data ?? [];
  const followed = new Set(
    (followsResult.data ?? []).map((item) => item.following_id),
  );
  const likeCounts = new Map<string, number>();
  const commentCounts = new Map<string, number>();
  const repostCounts = new Map<string, number>();
  const shareCounts = new Map<string, number>();
  const liked = new Set<string>();
  const reposted = new Set<string>();
  for (const item of likes) {
    likeCounts.set(item.post_id, (likeCounts.get(item.post_id) ?? 0) + 1);
    if (item.profile_id === viewerId) liked.add(item.post_id);
  }
  for (const item of comments) {
    commentCounts.set(
      item.post_id,
      (commentCounts.get(item.post_id) ?? 0) + 1,
    );
  }
  for (const item of reposts) {
    repostCounts.set(
      item.post_id,
      (repostCounts.get(item.post_id) ?? 0) + 1,
    );
    if (item.profile_id === viewerId) reposted.add(item.post_id);
  }
  for (const item of shares) {
    shareCounts.set(item.post_id, (shareCounts.get(item.post_id) ?? 0) + 1);
  }

  return posts.map((post) => {
    const profile = post.profiles as {
      uid: number;
      avatar_url: string | null;
    };
    return {
      id: post.id,
      authorId: post.author_id,
      authorUid: profile.uid,
      avatarPath: profile.avatar_url,
      body: post.body,
      mediaPaths: post.media_paths ?? [],
      createdAt: post.created_at,
      likeCount: likeCounts.get(post.id) ?? 0,
      likedByViewer: liked.has(post.id),
      commentCount: commentCounts.get(post.id) ?? 0,
      repostCount: repostCounts.get(post.id) ?? 0,
      repostedByViewer: reposted.has(post.id),
      shareCount: shareCounts.get(post.id) ?? 0,
      followingAuthor: followed.has(post.author_id),
    };
  });
}

/** Hashtag filters keep letters/digits/underscore only (matches linkifier). */
export function sanitizeFeedTag(value: string | undefined): string {
  return (value ?? "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 40);
}

export async function listFeed({
  limit = 12,
  authorUid,
  before,
  followingOnly = false,
  tag,
}: {
  limit?: number;
  authorUid?: number;
  /** Cursor: return posts created strictly before this timestamp. */
  before?: string;
  /** Only posts from members the viewer follows (empty when signed out). */
  followingOnly?: boolean;
  /** Only posts containing #tag. */
  tag?: string;
} = {}): Promise<FeedItem[]> {
  const supabase = await createClient();
  let followedIds: string[] | null = null;
  if (followingOnly) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: follows } = await supabase
      .from("member_follows")
      .select("following_id")
      .eq("follower_id", user.id);
    followedIds = (follows ?? []).map((row) => row.following_id);
    if (!followedIds.length) return [];
  }
  let query = supabase
    .from("member_feed_posts")
    .select(
      "id, author_id, body, media_paths, created_at, profiles!member_feed_posts_author_id_fkey!inner(uid, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (authorUid) query = query.eq("profiles.uid", authorUid);
  if (followedIds) query = query.in("author_id", followedIds);
  const cleanTag = sanitizeFeedTag(tag);
  if (cleanTag) query = query.ilike("body", `%#${cleanTag}%`);
  if (before) query = query.lt("created_at", before);
  const { data: posts, error } = await query;
  if (error) throw error;
  if (!posts?.length) return [];
  return hydrateFeedItems(supabase, posts as unknown as RawFeedPost[]);
}

export async function listFeedPage(
  page: number,
  pageSize = 12,
): Promise<{ items: FeedItem[]; totalPages: number }> {
  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const { data, count, error } = await supabase
    .from("member_feed_posts")
    .select(
      "id, author_id, body, media_paths, created_at, profiles!member_feed_posts_author_id_fkey!inner(uid, avatar_url)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return {
    items: await hydrateFeedItems(
      supabase,
      (data ?? []) as unknown as RawFeedPost[],
    ),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function getFeedPost(id: string): Promise<FeedItem | null> {
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("member_feed_posts")
    .select(
      "id, author_id, body, media_paths, created_at, profiles!member_feed_posts_author_id_fkey!inner(uid, avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!post) return null;
  const [item] = await hydrateFeedItems(supabase, [
    post as unknown as RawFeedPost,
  ]);
  return item ?? null;
}

export async function listFeedComments(
  postId: string,
  limit = 60,
): Promise<FeedComment[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: blocks } = user
    ? await supabase
        .from("member_blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id)
    : { data: [] as { blocked_id: string }[] };
  const blocked = new Set((blocks ?? []).map((item) => item.blocked_id));
  const { data } = await supabase
    .from("member_feed_comments")
    .select(
      "id, parent_id, author_id, body, media_paths, created_at, updated_at, profiles!member_feed_comments_author_id_fkey!inner(uid, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const visible = (data ?? []).filter(
    (comment) => !blocked.has(comment.author_id),
  );

  const ids = visible.map((comment) => comment.id);
  const { data: likes } = ids.length
    ? await supabase
        .from("member_feed_comment_likes")
        .select("comment_id, profile_id")
        .in("comment_id", ids)
    : { data: [] as { comment_id: string; profile_id: string }[] };
  const likeCounts = new Map<string, number>();
  const likedByViewer = new Set<string>();
  for (const like of likes ?? []) {
    likeCounts.set(like.comment_id, (likeCounts.get(like.comment_id) ?? 0) + 1);
    if (user && like.profile_id === user.id) likedByViewer.add(like.comment_id);
  }
  const replyCounts = new Map<string, number>();
  for (const comment of visible) {
    if (comment.parent_id) {
      replyCounts.set(
        comment.parent_id,
        (replyCounts.get(comment.parent_id) ?? 0) + 1,
      );
    }
  }

  return visible.map((comment) => {
    const profile = comment.profiles as unknown as {
      uid: number;
      avatar_url: string | null;
    };
    return {
      id: comment.id,
      parentId: comment.parent_id ?? null,
      edited:
        new Date(comment.updated_at).getTime() -
          new Date(comment.created_at).getTime() >
        2000,
      authorId: comment.author_id,
      authorUid: profile.uid,
      avatarPath: profile.avatar_url,
      body: comment.body,
      mediaPaths: comment.media_paths ?? [],
      createdAt: comment.created_at,
      likeCount: likeCounts.get(comment.id) ?? 0,
      likedByViewer: likedByViewer.has(comment.id),
      replyCount: replyCounts.get(comment.id) ?? 0,
    };
  });
}

export type FollowConnection = { uid: number; avatarPath: string | null };

// Follow edges are public reads (SNS convention); lists cap at the most
// recent 100 connections per direction.
export async function listFollowConnections(profileId: string): Promise<{
  followers: FollowConnection[];
  following: FollowConnection[];
}> {
  const supabase = await createClient();
  const toConnection = (row: unknown): FollowConnection => {
    const profile = (
      row as { profiles: { uid: number; avatar_url: string | null } }
    ).profiles;
    return { uid: profile.uid, avatarPath: profile.avatar_url };
  };
  const [followerRows, followingRows] = await Promise.all([
    supabase
      .from("member_follows")
      .select(
        "created_at, profiles!member_follows_follower_id_fkey!inner(uid, avatar_url)",
      )
      .eq("following_id", profileId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("member_follows")
      .select(
        "created_at, profiles!member_follows_following_id_fkey!inner(uid, avatar_url)",
      )
      .eq("follower_id", profileId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  return {
    followers: (followerRows.data ?? []).map(toConnection),
    following: (followingRows.data ?? []).map(toConnection),
  };
}

export async function getMemberNetworkStats(
  profileId: string | null,
): Promise<MemberNetworkStats> {
  if (!profileId) return { posts: 0, followers: 0, following: 0 };
  const supabase = await createClient();
  const [posts, followers, following] = await Promise.all([
    supabase
      .from("member_feed_posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profileId),
    supabase
      .from("member_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", profileId),
    supabase
      .from("member_follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);
  return {
    posts: posts.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}
