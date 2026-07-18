"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState, useSyncExternalStore } from "react";
import { listFeedEngagement, recordFeedView } from "@/app/actions/feed";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { postMediaUrl } from "@/lib/media";
import { LikeIcon } from "@/components/feed/FeedIcons";

type Identity = { uid: number; avatarPath: string | null };

// Signed-in viewers record a view; the post author and admins additionally
// get the likers/viewers breakdown (the server action returns null for
// everyone else, so nothing renders).
export function FeedInsights({
  postId,
  signedIn,
  labels,
}: {
  postId: string;
  signedIn: boolean;
  labels: { likedBy: string; viewedBy: string; views: string; close: string };
}) {
  const [data, setData] = useState<{
    likers: Identity[];
    viewers: Identity[];
  } | null>(null);
  const [open, setOpen] = useState<"likers" | "viewers" | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function openSheet(kind: "likers" | "viewers") {
    setOpen(kind);
    // Counts drift as members like/unlike; refresh whenever the sheet opens.
    const fresh = await listFeedEngagement(postId);
    if (fresh) setData(fresh);
  }

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    const refresh = async () => {
      const result = await listFeedEngagement(postId);
      if (!cancelled && result) setData(result);
    };
    const timer = setTimeout(async () => {
      await recordFeedView(postId);
      await refresh();
    }, 400);
    // Like/unlike anywhere on this post refreshes the counters live.
    const onChanged = (event: Event) => {
      const changed = (event as CustomEvent<{ postId?: string }>).detail
        ?.postId;
      if (changed === postId) void refresh();
    };
    window.addEventListener("b2bb2g:feed-engagement-changed", onChanged);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("b2bb2g:feed-engagement-changed", onChanged);
    };
  }, [postId, signedIn]);

  if (!data) return null;

  const sheet = open
    ? { title: open === "likers" ? labels.likedBy : labels.viewedBy, rows: data[open] }
    : null;

  return (
    <>
      <div className="flex items-center gap-2 text-xs font-bold text-ink-faint">
        <button
          type="button"
          onClick={() => void openSheet("likers")}
          title={labels.likedBy}
          className="flex min-h-8 items-center gap-1.5 rounded-full bg-surface-sub px-3 transition-colors hover:bg-line/60"
        >
          <LikeIcon className="h-3.5 w-3.5 fill-none stroke-current stroke-[2]" />
          <span className="sr-only">{labels.likedBy}</span>
          {data.likers.length}
        </button>
        <button
          type="button"
          onClick={() => void openSheet("viewers")}
          title={labels.viewedBy}
          className="flex min-h-8 items-center gap-1.5 rounded-full bg-surface-sub px-3 transition-colors hover:bg-line/60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="sr-only">{labels.viewedBy}</span>
          {data.viewers.length}
        </button>
      </div>

      {mounted && sheet && createPortal(
        <div
          className="fixed inset-0 z-[240] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={sheet.title}
            className="flex max-h-[70dvh] w-full flex-col rounded-t-[1.5rem] bg-white shadow-2xl sm:max-w-sm sm:rounded-[1.5rem]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-sm font-extrabold">
                {sheet.title}
                <span className="ml-1.5 text-ink-faint">{sheet.rows.length}</span>
              </p>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label={labels.close}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-sub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-line/70 overflow-y-auto px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {sheet.rows.map((row) => (
                <li key={row.uid}>
                  <Link
                    href={`/u/${row.uid}`}
                    className="flex items-center gap-3 py-2.5 transition-colors hover:text-primary"
                  >
                    {row.avatarPath ? (
                      <Image
                        src={postMediaUrl(row.avatarPath)}
                        alt=""
                        width={34}
                        height={34}
                        className="h-8.5 w-8.5 rounded-full border border-line object-cover"
                      />
                    ) : (
                      <DefaultAvatar className="h-8.5 w-8.5" />
                    )}
                    <span className="text-sm font-extrabold">UID:{row.uid}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
