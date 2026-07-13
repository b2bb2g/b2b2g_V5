"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { postMediaUrl } from "@/lib/media";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { FeedMediaCarousel } from "@/components/feed/FeedMediaCarousel";

export type FeedMediaLabels = {
  openImage: string;
  closeImage: string;
  previousImage: string;
  nextImage: string;
  fullPost: string;
  closePost: string;
  more: string;
  publicPost: string;
};

export function FeedMediaGrid({
  paths,
  body,
  authorUid,
  avatarPath,
  createdAt,
  labels,
}: {
  paths: string[];
  body: string;
  authorUid: string | number;
  avatarPath: string | null;
  createdAt: string;
  labels: FeedMediaLabels;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetCloseRef = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLSpanElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [summaryOverflows, setSummaryOverflows] = useState(false);
  const visible = paths.slice(0, 4);
  const extra = Math.max(0, paths.length - visible.length);
  const layout =
    visible.length === 1
      ? "grid-cols-1 aspect-[16/10]"
      : visible.length === 2
        ? "grid-cols-2 aspect-[16/9]"
        : visible.length === 3
          ? "grid-cols-[2fr_1fr] grid-rows-2 aspect-[16/10]"
          : "grid-cols-[2fr_1fr] grid-rows-3 aspect-[16/10]";

  const closeViewer = useCallback(() => {
    setPostOpen(false);
    setOpenIndex(null);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null
          ? current
          : (current + delta + paths.length) % paths.length,
      );
    },
    [paths.length],
  );
  const modalOpen = openIndex !== null;

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (postOpen) {
          setPostOpen(false);
          closeRef.current?.focus();
        } else {
          closeViewer();
        }
      }
      if (!postOpen && event.key === "ArrowLeft") step(-1);
      if (!postOpen && event.key === "ArrowRight") step(1);
      if (event.key !== "Tab") return;

      const focusRoot = postOpen ? sheetRef.current : dialogRef.current;
      const controls = focusRoot?.querySelectorAll<HTMLElement>(
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
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [closeViewer, modalOpen, postOpen, step]);

  useEffect(() => {
    if (postOpen) sheetCloseRef.current?.focus();
  }, [postOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const element = summaryRef.current;
    if (!element) return;
    const measure = () => {
      setSummaryOverflows(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [body, modalOpen]);

  const avatarUrl = avatarPath ? postMediaUrl(avatarPath) : null;

  if (!paths.length) return null;

  return (
    <>
      <div
        className={`grid overflow-hidden gap-0.5 bg-line ${layout}`}
      >
        {visible.map((path, index) => {
          const featured = visible.length >= 3 && index === 0;
          return (
            <button
              type="button"
              key={`${path}-${index}`}
              aria-label={`${labels.openImage} ${index + 1} / ${paths.length}`}
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setOpenIndex(index);
              }}
              className={`group relative min-h-0 cursor-zoom-in bg-surface-sub text-left focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-primary ${featured && visible.length === 3 ? "row-span-2" : ""} ${featured && visible.length === 4 ? "row-span-3" : ""}`}
            >
              <Image
                src={postMediaUrl(path)}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 680px"
                className="object-cover transition duration-300 group-hover:brightness-[.96]"
              />
              {extra > 0 && index === visible.length - 1 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-3xl font-extrabold text-white backdrop-blur-[1px]">
                  +{extra}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openIndex !== null &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${labels.openImage} ${openIndex + 1} / ${paths.length}`}
            className="fixed inset-0 z-[240] flex flex-col bg-[#07090d] text-white"
          >
            <div className="relative z-20 flex min-h-16 items-center justify-between px-4 pt-[max(.75rem,env(safe-area-inset-top))] sm:px-6">
              <span aria-live="polite" className="text-sm font-semibold tabular-nums text-white/85">
                {openIndex + 1} / {paths.length}
              </span>
              <button
                ref={closeRef}
                type="button"
                aria-label={labels.closeImage}
                onClick={closeViewer}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <CloseIcon />
              </button>
            </div>

            <FeedMediaCarousel
              paths={paths}
              activeIndex={openIndex}
              onActiveIndexChange={setOpenIndex}
              openImageLabel={labels.openImage}
              previousLabel={labels.previousImage}
              nextLabel={labels.nextImage}
            />

            <div className="relative z-20 border-t border-white/10 bg-[#11151c]/96 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6">
              <div className="mx-auto flex max-w-4xl items-center gap-3">
                <Link
                  href={`/u/${authorUid}`}
                  onClick={closeViewer}
                  aria-label={`UID:${authorUid}`}
                  className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full border border-white/20 object-cover"
                    />
                  ) : (
                    <DefaultAvatar className="h-11 w-11 border-white/20 bg-white/15" />
                  )}
                  <strong className="hidden text-sm font-extrabold sm:block">
                    UID:{authorUid}
                  </strong>
                </Link>
                <button
                  type="button"
                  aria-label={labels.fullPost}
                  onClick={() => setPostOpen(true)}
                  className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span
                    ref={summaryRef}
                    className="line-clamp-2 text-sm leading-5 text-white/88"
                  >
                    {body}
                  </span>
                  {summaryOverflows && (
                    <span className="text-xs font-bold text-white/60">
                      {labels.more}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {postOpen && (
              <div
                className="absolute inset-0 z-30 flex items-end justify-center bg-black/55 px-0 sm:px-4"
                onClick={() => setPostOpen(false)}
              >
                <div
                  ref={sheetRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label={labels.fullPost}
                  className="feed-post-sheet max-h-[86dvh] w-full max-w-2xl overflow-hidden rounded-t-[1.75rem] bg-white text-ink shadow-2xl sm:mb-5 sm:rounded-[1.75rem]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-center pb-1 pt-3 sm:hidden" aria-hidden="true">
                    <span className="h-1 w-10 rounded-full bg-line" />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                    <Link
                      href={`/u/${authorUid}`}
                      onClick={closeViewer}
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
                        <span className="flex items-center gap-1 text-xs text-ink-faint">
                          <time dateTime={createdAt}>{createdAt.slice(0, 10)}</time>
                          <span aria-hidden="true">·</span>
                          <span>{labels.publicPost}</span>
                        </span>
                      </span>
                    </Link>
                    <button
                      ref={sheetCloseRef}
                      type="button"
                      aria-label={labels.closePost}
                      onClick={() => {
                        setPostOpen(false);
                        closeRef.current?.focus();
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-sub text-ink-soft transition hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="max-h-[calc(86dvh-5.5rem)] overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
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
