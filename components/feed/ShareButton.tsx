"use client";

import { useState, useTransition } from "react";
import { recordFeedShare } from "@/app/actions/feed";
import { SendIcon } from "@/components/feed/FeedIcons";

export function ShareButton({
  url,
  title,
  label,
  copiedLabel,
  postId,
  viewerId,
  returnTo,
  count,
  className,
  showLabel = false,
}: {
  url: string;
  title: string;
  label: string;
  copiedLabel: string;
  postId: string;
  viewerId: string | null;
  returnTo: string;
  count: number;
  className?: string;
  showLabel?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function record() {
    if (!viewerId) return;
    const formData = new FormData();
    formData.set("postId", postId);
    formData.set("returnTo", returnTo);
    startTransition(() => recordFeedShare(formData));
  }

  async function share() {
    const absolute = new URL(url, window.location.origin).toString();
    if (navigator.share) {
      const shared = await navigator.share({ title, url: absolute }).then(
        () => true,
        () => false,
      );
      if (shared) record();
      return;
    }
    await navigator.clipboard.writeText(absolute);
    record();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      className={
        className ??
        "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-ink-soft transition hover:bg-surface-sub hover:text-ink"
      }
    >
      <SendIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
      {count > 0 && <span>{count}</span>}
      <span className={showLabel ? "hidden sm:inline" : "sr-only"}>
        {copied ? copiedLabel : label}
      </span>
      {showLabel && (
        <span className="sr-only sm:hidden">
          {copied ? copiedLabel : label}
        </span>
      )}
    </button>
  );
}
