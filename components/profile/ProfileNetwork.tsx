"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useState, useSyncExternalStore } from "react";
import { useEscape } from "@/lib/use-escape";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { postMediaUrl } from "@/lib/media";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import type { FollowConnection } from "@/lib/data/feed";

// Instagram-style network row on the public profile: counts up front,
// follower/following lists one tap away in a bottom sheet.
export function ProfileNetwork({
  posts,
  followers,
  following,
  labels,
}: {
  posts: number;
  followers: FollowConnection[];
  following: FollowConnection[];
  labels: {
    posts: string;
    followers: string;
    following: string;
    close: string;
    empty: string;
  };
}) {
  const [open, setOpen] = useState<"followers" | "following" | null>(null);
  useEscape(Boolean(open), () => setOpen(null));
  const sheetTrap = useFocusTrap<HTMLDivElement>(Boolean(open));
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const sheet = open
    ? {
        title: open === "followers" ? labels.followers : labels.following,
        rows: open === "followers" ? followers : following,
      }
    : null;

  return (
    <>
      <div className="mt-5 flex items-center gap-5 text-sm">
        <span className="font-semibold text-ink-soft">
          <strong className="mr-1 text-base font-extrabold text-ink">
            {posts}
          </strong>
          {labels.posts}
        </span>
        {(
          [
            ["followers", followers.length, labels.followers],
            ["following", following.length, labels.following],
          ] as const
        ).map(([key, count, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setOpen(key)}
            className="rounded-lg font-semibold text-ink-soft transition-colors hover:text-primary"
          >
            <strong className="mr-1 text-base font-extrabold text-ink">
              {count}
            </strong>
            {label}
          </button>
        ))}
      </div>

      {mounted && sheet && createPortal(
        <div
          className="fixed inset-0 z-[240] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(null);
          }}
        >
          <div
            ref={sheetTrap}
            role="dialog"
            aria-modal="true"
            aria-label={sheet.title}
            tabIndex={-1}
            className="flex max-h-[70dvh] w-full flex-col rounded-t-[1.5rem] bg-white shadow-2xl sm:max-w-sm sm:rounded-[1.5rem]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-sm font-extrabold">
                {sheet.title}
                <span className="ml-1.5 text-ink-faint">
                  {sheet.rows.length}
                </span>
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
            <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-[max(.75rem,env(safe-area-inset-bottom))]">
              {sheet.rows.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-ink-faint">
                  {labels.empty}
                </p>
              ) : (
                sheet.rows.map((row) => (
                  <Link
                    key={row.uid}
                    href={`/u/${row.uid}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-sub"
                  >
                    {row.avatarPath ? (
                      <Image
                        src={postMediaUrl(row.avatarPath)}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full border border-line object-cover"
                      />
                    ) : (
                      <DefaultAvatar className="h-9 w-9" />
                    )}
                    <span className="text-sm font-extrabold">
                      UID:{row.uid}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
