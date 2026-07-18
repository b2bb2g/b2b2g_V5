"use client";

import { CommentIcon } from "@/components/feed/FeedIcons";

export const OPEN_POST_EVENT = "b2bb2g:open-feed-post";

// Stream cards open the post dialog for comments instead of navigating,
// matching how the body text tap behaves. The dialog lives inside
// FeedPostContent, which listens for this event.
export function FeedCommentTrigger({
  postId,
  count,
  label,
}: {
  postId: string;
  count: number;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent(OPEN_POST_EVENT, { detail: { postId } }),
        );
      }}
      className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-bold text-ink-soft transition hover:bg-surface-sub"
    >
      <CommentIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
      {count > 0 && <span>{count}</span>}
      <span className="sr-only">{label}</span>
    </button>
  );
}
