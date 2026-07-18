"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { FeedMediaCarousel } from "@/components/feed/FeedMediaCarousel";
import {
  FeedFocusEngagement,
  type FeedFocusEngagementData,
  type FeedFocusLabels,
} from "@/components/feed/FeedFocusEngagement";
import { toggleMemberFollow } from "@/app/actions/feed";
import { PendingButton } from "@/components/ui/PendingButton";
import { postMediaUrl } from "@/lib/media";
import type { FeedMediaLabels } from "@/components/feed/FeedMediaGrid";
import { RelativeTime } from "@/components/feed/RelativeTime";
import { GlobeIcon } from "@/components/feed/FeedIcons";

export function FeedPostFocusDialog({
  open,
  onClose,
  postId,
  body,
  paths,
  authorUid,
  avatarPath,
  createdAt,
  renderedAt,
  engagement,
  labels,
  initialIndex = 0,
}: {
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
  postId: string;
  body: string;
  paths: string[];
  authorUid: string | number;
  avatarPath: string | null;
  createdAt: string;
  renderedAt: string;
  engagement: FeedFocusEngagementData & { followingAuthor: boolean };
  labels: FeedMediaLabels &
    FeedFocusLabels & { follow: string; following: string };
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pushedHistoryRef = useRef(false);
  const focusHash = `#post-${postId}`;

  const requestClose = useCallback(() => {
    if (pushedHistoryRef.current && window.location.hash === focusHash) {
      window.history.back();
      return;
    }
    onClose();
  }, [focusHash, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    if (window.location.hash !== focusHash) {
      window.history.pushState(
        { ...window.history.state, feedFocusPost: postId },
        "",
        focusHash,
      );
      pushedHistoryRef.current = true;
    }

    const onPopState = () => {
      if (!pushedHistoryRef.current) return;
      pushedHistoryRef.current = false;
      onClose();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("popstate", onPopState);
    };
  }, [focusHash, onClose, open, postId]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (paths.length > 1 && event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          (current - 1 + paths.length) % paths.length,
        );
      }
      if (paths.length > 1 && event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % paths.length);
      }
      if (event.key !== "Tab") return;

      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, paths.length, requestClose]);

  if (!open) return null;

  const avatarUrl = avatarPath ? postMediaUrl(avatarPath) : null;
  const isOwn = engagement.viewerId === engagement.authorId;
  const sharePath = `/feed/${postId}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-black/65 p-0 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.fullPost}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragY ? "none" : "transform 200ms ease-out",
        }}
        className={`feed-post-sheet flex h-dvh w-full max-w-6xl overflow-hidden bg-white text-ink shadow-2xl sm:h-[min(88dvh,56rem)] sm:rounded-[1.75rem] ${paths.length ? "flex-col md:grid md:grid-cols-[minmax(0,1.55fr)_minmax(20rem,.8fr)]" : "max-w-2xl flex-col"}`}
      >
        {paths.length > 0 && (
          <div className="flex min-h-[46dvh] min-w-0 flex-1 bg-[#07090d] md:min-h-0">
            <FeedMediaCarousel
              paths={paths}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              openImageLabel={labels.openImage}
              previousLabel={labels.previousImage}
              nextLabel={labels.nextImage}
              onDismiss={requestClose}
            />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div
            className="touch-pan-x border-b border-line px-5 pb-4 sm:px-6 sm:pt-4"
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") return;
              dragStart.current = event.clientY;
            }}
            onPointerMove={(event) => {
              if (dragStart.current === null) return;
              setDragY(Math.max(0, event.clientY - dragStart.current));
            }}
            onPointerUp={(event) => {
              if (dragStart.current === null) return;
              const delta = event.clientY - dragStart.current;
              dragStart.current = null;
              if (delta > 110) requestClose();
              setDragY(0);
            }}
            onPointerCancel={() => {
              dragStart.current = null;
              setDragY(0);
            }}
          >
            <div className="flex justify-center py-2.5 sm:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-line" />
            </div>
            <div className="flex items-center justify-between gap-3">
            <Link
              href={`/u/${authorUid}`}
              onClick={onClose}
              className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border border-line object-cover"
                />
              ) : (
                <DefaultAvatar className="h-12 w-12" />
              )}
              <span className="min-w-0">
                <strong className="block truncate text-sm font-extrabold">
                  UID:{authorUid}
                </strong>
                <span className="flex items-center gap-1 whitespace-nowrap text-xs text-ink-faint">
                  <RelativeTime
                    dateTime={createdAt}
                    locale={labels.locale}
                    initialNow={renderedAt}
                    justNowLabel={labels.justNow}
                  />
                  <span aria-hidden="true">·</span>
                  <GlobeIcon className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]" />
                  <span className="sr-only">{labels.publicPost}</span>
                </span>
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              {!isOwn &&
                (engagement.viewerId ? (
                  <form action={toggleMemberFollow}>
                    <input
                      type="hidden"
                      name="targetId"
                      value={engagement.authorId}
                    />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={engagement.returnTo}
                    />
                    <PendingButton
                      pendingLabel=""
                      title={
                        engagement.followingAuthor
                          ? labels.following
                          : labels.follow
                      }
                      className={
                        engagement.followingAuthor
                          ? "flex h-9 w-9 items-center justify-center rounded-full bg-surface-sub text-positive hover:bg-line/70"
                          : "rounded-full px-2.5 py-2 text-xs font-extrabold text-primary hover:bg-primary-soft sm:px-3 sm:text-sm"
                      }
                    >
                      {engagement.followingAuthor ? (
                        <>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          <span className="sr-only">{labels.following}</span>
                        </>
                      ) : (
                        `＋ ${labels.follow}`
                      )}
                    </PendingButton>
                  </form>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(sharePath)}`}
                    className="rounded-full px-2.5 py-2 text-xs font-extrabold text-primary hover:bg-primary-soft sm:px-3 sm:text-sm"
                  >
                    ＋ {labels.follow}
                  </Link>
                ))}
              <button
                ref={closeRef}
                type="button"
                aria-label={labels.closePost}
                onClick={requestClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-sub text-ink-soft transition hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <CloseIcon />
              </button>
            </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="whitespace-pre-wrap px-5 pt-5 text-[15px] leading-7 text-ink sm:px-6 sm:pt-6">
              {body}
            </p>
            <FeedFocusEngagement
              postId={postId}
              body={body}
              data={engagement}
              labels={labels}
              renderedAt={renderedAt}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
