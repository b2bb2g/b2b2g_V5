"use client";

import { togglePostBookmark } from "@/app/actions/bookmarks";
import { PendingButton } from "@/components/ui/PendingButton";

// Heart toggle for saving a product (wishlist).
export function BookmarkButton({
  postId,
  returnTo,
  saved,
  saveLabel,
  savedLabel,
}: {
  postId: string;
  returnTo: string;
  saved: boolean;
  saveLabel: string;
  savedLabel: string;
}) {
  return (
    <form action={togglePostBookmark}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <PendingButton
        pendingLabel=""
        aria-pressed={saved}
        title={saved ? savedLabel : saveLabel}
        className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
          saved
            ? "border-negative/30 bg-negative-soft text-negative"
            : "border-line bg-white text-ink-soft hover:border-negative/40 hover:text-negative"
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        <span className="sr-only">{saved ? savedLabel : saveLabel}</span>
      </PendingButton>
    </form>
  );
}
