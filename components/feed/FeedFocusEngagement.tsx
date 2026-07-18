"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  toggleFeedLike,
  toggleFeedRepost,
} from "@/app/actions/feed";
import {
  CommentIcon,
  LikeIcon,
  RepostIcon,
} from "@/components/feed/FeedIcons";
import { ShareButton } from "@/components/feed/ShareButton";
import { PendingButton } from "@/components/ui/PendingButton";
import type { FeedComment } from "@/lib/data/feed";
import { CommentComposer } from "@/components/feed/CommentComposer";
import { CommentList } from "@/components/feed/CommentList";
import { FeedInsights } from "@/components/feed/FeedInsights";
import type { Locale } from "@/lib/constants";

export type FeedFocusLabels = {
  locale: Locale;
  justNow: string;
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
  reply: string;
  moreReplies: string;
  addImage: string;
  addEmoji: string;
  removeImage: string;
  uploadError: string;
  likedBy: string;
  viewedBy: string;
  views: string;
  close: string;
  cancel: string;
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
  renderedAt,
}: {
  postId: string;
  body: string;
  data: FeedFocusEngagementData;
  labels: FeedFocusLabels;
  renderedAt: string;
}) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
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

  const displayedCommentCount = loading ? data.commentCount : comments.length;

  return (
    <section className="mt-6 border-t border-line/80" aria-label={labels.comments}>
      <div className="grid grid-cols-4 border-b border-line/80 px-2 py-1 text-ink-soft">
        {data.viewerId ? (
          <form
            action={async (formData: FormData) => {
              await toggleFeedLike(formData);
              window.dispatchEvent(
                new CustomEvent("b2bb2g:feed-engagement-changed", {
                  detail: { postId },
                }),
              );
            }}
          >
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="returnTo" value={data.returnTo} />
            <PendingButton
              aria-pressed={data.likedByViewer}
              title={data.likedByViewer ? labels.liked : labels.like}
              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-bold transition hover:bg-surface-sub ${data.likedByViewer ? "text-primary" : "text-ink-soft"}`}
            >
              <LikeIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
              {data.likeCount > 0 && <span>{data.likeCount}</span>}
              <span className="sr-only">
                {data.likedByViewer ? labels.liked : labels.like}
              </span>
            </PendingButton>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            title={labels.like}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-bold hover:bg-surface-sub"
          >
            <LikeIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
            {data.likeCount > 0 && <span>{data.likeCount}</span>}
            <span className="sr-only">{labels.like}</span>
          </Link>
        )}

        {data.viewerId ? (
          <button
            type="button"
            onClick={() => composerRef.current?.focus()}
            title={labels.comment}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-bold hover:bg-surface-sub"
          >
            <CommentIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
            {displayedCommentCount > 0 && <span>{displayedCommentCount}</span>}
            <span className="sr-only">{labels.comment}</span>
          </button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            title={labels.comment}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-bold hover:bg-surface-sub"
          >
            <CommentIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
            {displayedCommentCount > 0 && <span>{displayedCommentCount}</span>}
            <span className="sr-only">{labels.comment}</span>
          </Link>
        )}

        {data.viewerId ? (
          <form action={toggleFeedRepost}>
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="returnTo" value={data.returnTo} />
            <PendingButton
              aria-pressed={data.repostedByViewer}
              title={data.repostedByViewer ? labels.reposted : labels.repost}
              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-bold transition hover:bg-surface-sub ${data.repostedByViewer ? "text-[#238558]" : "text-ink-soft"}`}
            >
              <RepostIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
              {data.repostCount > 0 && <span>{data.repostCount}</span>}
              <span className="sr-only">
                {data.repostedByViewer ? labels.reposted : labels.repost}
              </span>
            </PendingButton>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            title={labels.repost}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-bold hover:bg-surface-sub"
          >
            <RepostIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
            {data.repostCount > 0 && <span>{data.repostCount}</span>}
            <span className="sr-only">{labels.repost}</span>
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
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-bold text-ink-soft transition hover:bg-surface-sub hover:text-ink"
        />
      </div>

      <div className="px-5 pb-6 pt-5 sm:px-6">
        <h2 className="text-sm font-extrabold text-ink">
          {labels.comments}
          {displayedCommentCount > 0 && (
            <span className="ml-1 text-ink-faint">{displayedCommentCount}</span>
          )}
        </h2>

        <div className="mt-3">
          <FeedInsights
            postId={postId}
            signedIn={!!data.viewerId}
            labels={{
              likedBy: labels.likedBy,
              viewedBy: labels.viewedBy,
              views: labels.views,
              close: labels.close,
            }}
          />
        </div>

        {data.viewerId ? (
          <div className="mt-3">
            <CommentComposer
              postId={postId}
              returnTo={data.returnTo}
              userId={data.viewerId}
              onSubmitted={() => void loadComments()}
              labels={{
                placeholder: labels.commentPlaceholder,
                submit: labels.writeComment,
                addImage: labels.addImage,
                addEmoji: labels.addEmoji,
                removeImage: labels.removeImage,
                uploadError: labels.uploadError,
              }}
            />
          </div>
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
          <div className="mt-5">
            <CommentList
              postId={postId}
              comments={comments}
              viewerId={data.viewerId}
              returnTo={data.returnTo}
              locale={labels.locale}
              renderedAt={renderedAt}
              labels={{
                like: labels.like,
                reply: labels.reply,
                moreReplies: labels.moreReplies,
                delete: labels.deleteComment,
                justNow: labels.justNow,
                close: labels.close,
                cancel: labels.cancel,
                comments: labels.comments,
                placeholder: labels.commentPlaceholder,
                submit: labels.writeComment,
                addImage: labels.addImage,
                addEmoji: labels.addEmoji,
                removeImage: labels.removeImage,
                uploadError: labels.uploadError,
              }}
              onChanged={() => void loadComments()}
            />
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
