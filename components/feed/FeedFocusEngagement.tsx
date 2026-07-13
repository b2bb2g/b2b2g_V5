"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFeedComment,
  deleteFeedComment,
  toggleFeedLike,
  toggleFeedRepost,
} from "@/app/actions/feed";
import {
  CommentIcon,
  LikeIcon,
  RepostIcon,
} from "@/components/feed/FeedIcons";
import { ShareButton } from "@/components/feed/ShareButton";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { PendingButton } from "@/components/ui/PendingButton";
import type { FeedComment } from "@/lib/data/feed";
import { postMediaUrl } from "@/lib/media";

export type FeedFocusLabels = {
  like: string;
  liked: string;
  comment: string;
  comments: string;
  repost: string;
  reposted: string;
  share: string;
  copied: string;
  writeComment: string;
  commentPlaceholder: string;
  signInToComment: string;
  noComments: string;
  deleteComment: string;
  loading: string;
  error: string;
  tryAgain: string;
};

export type FeedFocusEngagementData = {
  authorId: string;
  viewerId: string | null;
  returnTo: string;
  likeCount: number;
  likedByViewer: boolean;
  commentCount: number;
  repostCount: number;
  repostedByViewer: boolean;
  shareCount: number;
};

export function FeedFocusEngagement({
  postId,
  body,
  data,
  labels,
}: {
  postId: string;
  body: string;
  data: FeedFocusEngagementData;
  labels: FeedFocusLabels;
}) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sharePath = `/feed/${postId}`;

  const fetchComments = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/feed/${postId}/comments`, {
      cache: "no-store",
      signal,
    });
    if (!response.ok) throw new Error("comments");
    const result = (await response.json()) as { comments?: FeedComment[] };
    return result.comments ?? [];
  }, [postId]);

  const loadComments = useCallback(async () => {
    try {
      const nextComments = await fetchComments();
      setLoadError(false);
      setComments(nextComments);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchComments]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchComments(controller.signal)
      .then((nextComments) => {
        setLoadError(false);
        setComments(nextComments);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [fetchComments]);

  async function submitComment(formData: FormData) {
    await createFeedComment(formData);
    formRef.current?.reset();
    await loadComments();
  }

  async function removeComment(formData: FormData) {
    await deleteFeedComment(formData);
    await loadComments();
  }

  const displayedCommentCount = Math.max(data.commentCount, comments.length);
  const reactionCount = data.likeCount + data.repostCount;

  return (
    <section className="mt-6 border-t border-line/80" aria-label={labels.comments}>
      <div className="flex min-h-11 items-center justify-between gap-3 px-5 py-2 text-xs text-ink-soft sm:px-6">
        <div className="flex items-center gap-1.5">
          {data.likeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white">
              <LikeIcon className="h-3 w-3 fill-none stroke-current stroke-[2.3]" />
            </span>
          )}
          {data.repostCount > 0 && (
            <span className="-ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#2f9e67] text-white ring-2 ring-white">
              <RepostIcon className="h-3 w-3 fill-none stroke-current stroke-[2.3]" />
            </span>
          )}
          {reactionCount > 0 && <span>{reactionCount}</span>}
        </div>
        {displayedCommentCount > 0 && (
          <button
            type="button"
            onClick={() => composerRef.current?.focus()}
            className="rounded-md hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {displayedCommentCount}{" "}
            {displayedCommentCount === 1 ? labels.comment : labels.comments}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 border-y border-line/80 px-2 py-1 text-ink-soft">
        {data.viewerId ? (
          <form action={toggleFeedLike}>
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="returnTo" value={data.returnTo} />
            <PendingButton
              aria-pressed={data.likedByViewer}
              title={data.likedByViewer ? labels.liked : labels.like}
              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-bold transition hover:bg-surface-sub ${data.likedByViewer ? "text-primary" : "text-ink-soft"}`}
            >
              <LikeIcon className="h-5 w-5 fill-none stroke-current stroke-[1.9]" />
              <span className="hidden sm:inline">
                {data.likedByViewer ? labels.liked : labels.like}
              </span>
              <span className="sr-only sm:hidden">
                {data.likedByViewer ? labels.liked : labels.like}
              </span>
            </PendingButton>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-bold hover:bg-surface-sub"
          >
            <LikeIcon className="h-5 w-5 fill-none stroke-current stroke-[1.9]" />
            <span className="hidden sm:inline">{labels.like}</span>
            <span className="sr-only sm:hidden">{labels.like}</span>
          </Link>
        )}

        {data.viewerId ? (
          <button
            type="button"
            onClick={() => composerRef.current?.focus()}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-bold hover:bg-surface-sub"
          >
            <CommentIcon className="h-5 w-5 fill-none stroke-current stroke-[1.9]" />
            <span className="hidden sm:inline">{labels.comment}</span>
            <span className="sr-only sm:hidden">{labels.comment}</span>
          </button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-bold hover:bg-surface-sub"
          >
            <CommentIcon className="h-5 w-5 fill-none stroke-current stroke-[1.9]" />
            <span className="hidden sm:inline">{labels.comment}</span>
            <span className="sr-only sm:hidden">{labels.comment}</span>
          </Link>
        )}

        {data.viewerId ? (
          <form action={toggleFeedRepost}>
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="returnTo" value={data.returnTo} />
            <PendingButton
              aria-pressed={data.repostedByViewer}
              title={data.repostedByViewer ? labels.reposted : labels.repost}
              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-bold transition hover:bg-surface-sub ${data.repostedByViewer ? "text-[#238558]" : "text-ink-soft"}`}
            >
              <RepostIcon className="h-5 w-5 fill-none stroke-current stroke-[1.9]" />
              <span className="hidden sm:inline">
                {data.repostedByViewer ? labels.reposted : labels.repost}
              </span>
              <span className="sr-only sm:hidden">
                {data.repostedByViewer ? labels.reposted : labels.repost}
              </span>
            </PendingButton>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-bold hover:bg-surface-sub"
          >
            <RepostIcon className="h-5 w-5 fill-none stroke-current stroke-[1.9]" />
            <span className="hidden sm:inline">{labels.repost}</span>
            <span className="sr-only sm:hidden">{labels.repost}</span>
          </Link>
        )}

        <ShareButton
          url={sharePath}
          title={body.slice(0, 80)}
          label={labels.share}
          copiedLabel={labels.copied}
          postId={postId}
          viewerId={data.viewerId}
          returnTo={data.returnTo}
          count={data.shareCount}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-bold text-ink-soft transition hover:bg-surface-sub hover:text-ink"
          showLabel
        />
      </div>

      <div className="px-5 pb-6 pt-5 sm:px-6">
        <h2 className="text-sm font-extrabold text-ink">
          {labels.comments}
          {displayedCommentCount > 0 && (
            <span className="ml-1 text-ink-faint">{displayedCommentCount}</span>
          )}
        </h2>

        {data.viewerId ? (
          <form
            ref={formRef}
            action={submitComment}
            className="mt-3 flex items-end gap-2"
          >
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="returnTo" value={data.returnTo} />
            <textarea
              ref={composerRef}
              name="body"
              required
              maxLength={800}
              rows={1}
              aria-label={labels.commentPlaceholder}
              placeholder={labels.commentPlaceholder}
              className="min-h-11 flex-1 resize-y rounded-2xl border border-line bg-surface-sub px-4 py-2.5 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
            <PendingButton className="btn-primary min-h-11 shrink-0 rounded-xl px-4 text-sm">
              {labels.writeComment}
            </PendingButton>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            className="mt-3 block rounded-2xl bg-primary-soft px-4 py-3 text-center text-sm font-bold text-primary hover:bg-primary/15"
          >
            {labels.signInToComment}
          </Link>
        )}

        {loading ? (
          <div className="flex min-h-24 items-center justify-center" role="status">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="sr-only">{labels.loading}</span>
          </div>
        ) : loadError ? (
          <div className="mt-5 rounded-2xl bg-negative-soft px-4 py-4 text-center text-sm text-negative">
            <p>{labels.error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setLoadError(false);
                void loadComments();
              }}
              className="mt-2 font-extrabold underline underline-offset-2"
            >
              {labels.tryAgain}
            </button>
          </div>
        ) : comments.length > 0 ? (
          <div className="mt-5 space-y-4">
            {comments.map((comment) => (
              <article key={comment.id} className="flex items-start gap-2.5">
                <Link href={`/u/${comment.authorUid}`} className="shrink-0">
                  {comment.avatarPath ? (
                    <Image
                      src={postMediaUrl(comment.avatarPath)}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <DefaultAvatar className="h-9 w-9" />
                  )}
                </Link>
                <div className="min-w-0 flex-1 rounded-2xl bg-surface-sub px-3.5 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/u/${comment.authorUid}`}
                        className="block truncate text-xs font-extrabold hover:text-primary"
                      >
                        UID:{comment.authorUid}
                      </Link>
                      <time
                        dateTime={comment.createdAt}
                        className="text-[11px] text-ink-faint"
                      >
                        {comment.createdAt.slice(0, 10)}
                      </time>
                    </div>
                    {data.viewerId === comment.authorId && (
                      <form action={removeComment}>
                        <input type="hidden" name="commentId" value={comment.id} />
                        <input type="hidden" name="postId" value={postId} />
                        <input type="hidden" name="returnTo" value={data.returnTo} />
                        <PendingButton
                          aria-label={labels.deleteComment}
                          title={labels.deleteComment}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink-faint hover:bg-white hover:text-negative"
                        >
                          ×
                        </PendingButton>
                      </form>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-soft">
                    {comment.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-surface-sub px-4 py-5 text-center text-sm text-ink-faint">
            {labels.noComments}
          </p>
        )}
      </div>
    </section>
  );
}
