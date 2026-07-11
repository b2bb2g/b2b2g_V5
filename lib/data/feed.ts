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
  authorId: string;
  authorUid: number;
  avatarPath: string | null;
  body: string;
  createdAt: string;
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

  return posts.map((post) => {
    const profile = post.profiles as {
      uid: number;
      avatar_url: string | null;
    };
    const postLikes = likes.filter((like) => like.post_id === post.id);
    const postReposts = reposts.filter((repost) => repost.post_id === post.id);
    return {
      id: post.id,
      authorId: post.author_id,
      authorUid: profile.uid,
      avatarPath: profile.avatar_url,
      body: post.body,
      mediaPaths: post.media_paths ?? [],
      createdAt: post.created_at,
      likeCount: postLikes.length,
      likedByViewer:
        !!viewerId && postLikes.some((like) => like.profile_id === viewerId),
      commentCount: comments.filter((comment) => comment.post_id === post.id)
        .length,
      repostCount: postReposts.length,
      repostedByViewer:
        !!viewerId &&
        postReposts.some((repost) => repost.profile_id === viewerId),
      shareCount: shares.filter((share) => share.post_id === post.id).length,
      followingAuthor: followed.has(post.author_id),
    };
  });
}

export async function listFeed({
  limit = 12,
  authorUid,
}: {
  limit?: number;
  authorUid?: number;
} = {}): Promise<FeedItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("member_feed_posts")
    .select(
      "id, author_id, body, media_paths, created_at, profiles!member_feed_posts_author_id_fkey!inner(uid, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (authorUid) query = query.eq("profiles.uid", authorUid);
  const { data: posts } = await query;
  if (!posts?.length) return [];
  return hydrateFeedItems(supabase, posts as unknown as RawFeedPost[]);
}

export async function getFeedPost(id: string): Promise<FeedItem | null> {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("member_feed_posts")
    .select(
      "id, author_id, body, media_paths, created_at, profiles!member_feed_posts_author_id_fkey!inner(uid, avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();
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
  const { data } = await supabase
    .from("member_feed_comments")
    .select(
      "id, author_id, body, created_at, profiles!member_feed_comments_author_id_fkey!inner(uid, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data ?? []).map((comment) => {
    const profile = comment.profiles as unknown as {
      uid: number;
      avatar_url: string | null;
    };
    return {
      id: comment.id,
      authorId: comment.author_id,
      authorUid: profile.uid,
      avatarPath: profile.avatar_url,
      body: comment.body,
      createdAt: comment.created_at,
    };
  });
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
