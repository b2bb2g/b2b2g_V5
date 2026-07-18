"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { deleteFeedComment, toggleFeedCommentLike } from "@/app/actions/feed";
import { PendingButton } from "@/components/ui/PendingButton";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { CommentComposer } from "@/components/feed/CommentComposer";
import { RelativeTime } from "@/components/feed/RelativeTime";
import { LikeIcon } from "@/components/feed/FeedIcons";
import { postMediaUrl } from "@/lib/media";
import type { FeedComment } from "@/lib/data/feed";
import type { Locale } from "@/lib/constants";

export type CommentListLabels = {
  like: string;
  reply: string;
  delete: string;
  justNow: string;
  close: string;
  comments: string;
  placeholder: string;
  submit: string;
  addImage: string;
  addEmoji: string;
  removeImage: string;
  uploadError: string;
};

function CommentRow({
  comment,
  postId,
  viewerId,
  returnTo,
  locale,
  renderedAt,
  labels,
  onOpenThread,
  onChanged,
  inThread = false,
}: {
  comment: FeedComment;
  postId: string;
  viewerId: string | null;
  returnTo: string;
  locale: Locale;
  renderedAt: string;
  labels: CommentListLabels;
  onOpenThread?: (id: string) => void;
  onChanged?: () => void;
  inThread?: boolean;
}) {
  return (
    <article className="flex items-start gap-2.5">
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
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-surface-sub px-3.5 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/u/${comment.authorUid}`}
                className="block truncate text-xs font-extrabold hover:text-primary"
              >
                UID:{comment.authorUid}
              </Link>
              <RelativeTime
                dateTime={comment.createdAt}
                locale={locale}
                initialNow={renderedAt}
                justNowLabel={labels.justNow}
                className="text-[11px] text-ink-faint"
              />
            </div>
            {viewerId === comment.authorId && (
              <form
                action={async (formData: FormData) => {
                  await deleteFeedComment(formData);
                  onChanged?.();
                }}
              >
                <input type="hidden" name="commentId" value={comment.id} />
                <input type="hidden" name="postId" value={postId} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <PendingButton
                  aria-label={labels.delete}
                  title={labels.delete}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-base text-ink-faint hover:bg-white hover:text-negative"
                >
                  ×
                </PendingButton>
              </form>
            )}
          </div>
          {comment.body.trim() && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink-soft">
              {comment.body}
            </p>
          )}
          {comment.mediaPaths.length > 0 && (
            <div className="mt-2 flex gap-2">
              {comment.mediaPaths.map((path) => (
                <Image
                  key={path}
                  src={postMediaUrl(path)}
                  alt=""
                  width={180}
                  height={180}
                  className="h-36 w-36 rounded-xl border border-line object-cover"
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 pl-1 text-xs font-bold text-ink-faint">
          {viewerId ? (
            <form
              action={async (formData: FormData) => {
                await toggleFeedCommentLike(formData);
                onChanged?.();
              }}
            >
              <input type="hidden" name="commentId" value={comment.id} />
              <input type="hidden" name="postId" value={postId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <PendingButton
                aria-pressed={comment.likedByViewer}
                className={`flex min-h-8 items-center gap-1 rounded-full px-2 transition-colors hover:bg-surface-sub ${comment.likedByViewer ? "text-primary" : ""}`}
              >
                <LikeIcon className="h-4 w-4 fill-none stroke-current stroke-[1.9]" />
                {labels.like}
                {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
              </PendingButton>
            </form>
          ) : (
            <span className="flex min-h-8 items-center gap-1 px-2">
              <LikeIcon className="h-4 w-4 fill-none stroke-current stroke-[1.9]" />
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </span>
          )}
          {!inThread && onOpenThread && (
            <button
              type="button"
              onClick={() => onOpenThread(comment.id)}
              className="flex min-h-8 items-center gap-1 rounded-full px-2 transition-colors hover:bg-surface-sub"
            >
              {labels.reply}
              {comment.replyCount > 0 && <span>{comment.replyCount}</span>}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// Threaded comment list: top-level rows open a focused thread dialog with
// replies, reply composer, and likes.
export function CommentList({
  postId,
  comments,
  viewerId,
  returnTo,
  locale,
  renderedAt,
  labels,
  onChanged,
}: {
  postId: string;
  comments: FeedComment[];
  viewerId: string | null;
  returnTo: string;
  locale: Locale;
  renderedAt: string;
  labels: CommentListLabels;
  onChanged?: () => void;
}) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const topLevel = comments.filter((comment) => !comment.parentId);
  const thread = threadId
    ? comments.find((comment) => comment.id === threadId)
    : null;
  const replies = threadId
    ? comments
        .filter((comment) => comment.parentId === threadId)
        .slice()
        .reverse()
    : [];

  return (
    <>
      <div className="space-y-4">
        {topLevel.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            postId={postId}
            viewerId={viewerId}
            returnTo={returnTo}
            locale={locale}
            renderedAt={renderedAt}
            labels={labels}
            onOpenThread={setThreadId}
            onChanged={onChanged}
          />
        ))}
      </div>

      {thread && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setThreadId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.comments}
            className="flex max-h-[88dvh] w-full flex-col rounded-t-[1.5rem] bg-white shadow-2xl sm:max-w-lg sm:rounded-[1.5rem]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-sm font-extrabold">{labels.comments}</p>
              <button
                type="button"
                onClick={() => setThreadId(null)}
                aria-label={labels.close}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-sub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <CommentRow
                comment={thread}
                postId={postId}
                viewerId={viewerId}
                returnTo={returnTo}
                locale={locale}
                renderedAt={renderedAt}
                labels={labels}
                onChanged={onChanged}
                inThread
              />
              {replies.length > 0 && (
                <div className="space-y-4 border-l-2 border-line pl-4">
                  {replies.map((replyComment) => (
                    <CommentRow
                      key={replyComment.id}
                      comment={replyComment}
                      postId={postId}
                      viewerId={viewerId}
                      returnTo={returnTo}
                      locale={locale}
                      renderedAt={renderedAt}
                      labels={labels}
                      onChanged={onChanged}
                      inThread
                    />
                  ))}
                </div>
              )}
            </div>
            {viewerId && (
              <div className="shrink-0 border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <CommentComposer
                  postId={postId}
                  parentId={thread.id}
                  returnTo={returnTo}
                  userId={viewerId}
                  autoFocus
                  onSubmitted={onChanged}
                  labels={{
                    placeholder: labels.placeholder,
                    submit: labels.submit,
                    addImage: labels.addImage,
                    addEmoji: labels.addEmoji,
                    removeImage: labels.removeImage,
                    uploadError: labels.uploadError,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
