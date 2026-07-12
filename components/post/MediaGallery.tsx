"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// Detail-page media gallery (A3): hero + thumbnail strip open a fullscreen
// lightbox with swipe, arrow keys and Escape. Pure presentation — only URLs
// the viewer is already allowed to see are passed in.
export function MediaGallery({
  images,
  heroIndex,
  showHero,
  title,
  closeLabel,
  variant = "default",
  videoSrc = null,
  videoLabel = "Video",
  initialMedia = "image",
  previousLabel = "Previous image",
  nextLabel = "Next image",
}: {
  images: string[];
  heroIndex: number;
  showHero: boolean;
  title: string;
  closeLabel: string;
  variant?: "default" | "commerce";
  videoSrc?: string | null;
  videoLabel?: string;
  initialMedia?: "image" | "video";
  previousLabel?: string;
  nextLabel?: string;
}) {
  const isCommerce = variant === "commerce";
  const hasVideo = isCommerce && !!videoSrc;
  const videoIndex = images.length;
  const initialIndex =
    initialMedia === "video" && hasVideo ? videoIndex : heroIndex;
  const [open, setOpen] = useState<number | null>(null);
  const [selected, setSelected] = useState(initialIndex);
  const touchX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const mediaCount = images.length + (hasVideo ? 1 : 0);
  const selectedIsVideo = hasVideo && selected === videoIndex;

  const step = useCallback(
    (delta: number) => {
      setOpen((current) =>
        current === null
          ? current
          : (current + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  const modalOpen = open !== null;
  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "Tab") {
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
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [modalOpen, step]);

  if (mediaCount === 0) return null;

  return (
    <>
      {showHero && isCommerce ? (
        <div
          className={
            mediaCount > 1
              ? "flex min-w-0 flex-col-reverse gap-3 sm:grid sm:grid-cols-[4.75rem_minmax(0,1fr)]"
              : "min-w-0"
          }
        >
          {mediaCount > 1 && (
            <div className="scrollbar-none flex snap-x gap-2 overflow-x-auto sm:max-h-[36rem] sm:flex-col sm:overflow-y-auto">
              {images.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-label={`${title} ${index + 1}`}
                  aria-pressed={selected === index}
                  className={`relative aspect-square w-[4.75rem] shrink-0 snap-start overflow-hidden rounded-xl bg-surface-sub ring-2 ring-offset-2 transition ${
                    selected === index
                      ? "ring-primary"
                      : "ring-transparent hover:ring-line"
                  }`}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="76px"
                    className="object-cover"
                  />
                </button>
              ))}
              {hasVideo && (
                <button
                  type="button"
                  onClick={() => setSelected(videoIndex)}
                  aria-label={videoLabel}
                  aria-pressed={selectedIsVideo}
                  className={`relative flex aspect-square w-[4.75rem] shrink-0 snap-start items-center justify-center overflow-hidden rounded-xl bg-[#101923] text-white ring-2 ring-offset-2 transition ${
                    selectedIsVideo
                      ? "ring-primary"
                      : "ring-transparent hover:ring-line"
                  }`}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="sr-only">{videoLabel}</span>
                </button>
              )}
            </div>
          )}
          {selectedIsVideo ? (
            <div className="flex aspect-square w-full items-center overflow-hidden rounded-[1.5rem] bg-[#101923]">
              <iframe
                src={videoSrc!}
                title={`${title} — ${videoLabel}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full border-0"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setOpen(selected);
              }}
              className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[1.5rem] bg-surface-sub"
            >
              <Image
                src={images[selected]}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                priority
              />
              <span
                aria-hidden="true"
                className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur"
              >
                +
              </span>
            </button>
          )}
        </div>
      ) : showHero ? (
        <button
          type="button"
          onClick={(event) => {
            openerRef.current = event.currentTarget;
            setOpen(heroIndex);
          }}
          className="relative block aspect-video w-full cursor-zoom-in overflow-hidden rounded-card bg-surface-sub"
        >
          <Image
            src={images[heroIndex]}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </button>
      ) : null}

      {images.length > 1 && (!isCommerce || !showHero) && (
        <div className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setOpen(index);
              }}
              className="relative aspect-square w-40 shrink-0 cursor-zoom-in snap-start overflow-hidden rounded-xl bg-surface-sub"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {open !== null &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-[200] flex flex-col bg-[#05070a]"
            onClick={() => setOpen(null)}
            onTouchStart={(e) => {
              touchX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchX.current;
              touchX.current = null;
              if (start === null) return;
              const delta = (e.changedTouches[0]?.clientX ?? start) - start;
              if (Math.abs(delta) > 40) step(delta > 0 ? -1 : 1);
            }}
          >
            <div className="relative z-20 flex items-center justify-between px-4 py-3 text-white sm:px-6 sm:py-4">
              <span className="text-sm font-semibold tabular-nums">
                {open + 1} / {images.length}
              </span>
              <button
                ref={closeRef}
                type="button"
                aria-label={closeLabel}
                onClick={() => setOpen(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <svg
                  width="18"
                  height="18"
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
              </button>
            </div>
            <div
              className="relative min-h-0 flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[open]}
                alt={title}
                fill
                sizes="100vw"
                className="object-contain p-4 sm:p-10"
                priority
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={previousLabel}
                    onClick={(event) => {
                      event.stopPropagation();
                      step(-1);
                    }}
                    className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/80 sm:left-6"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label={nextLabel}
                    onClick={(event) => {
                      event.stopPropagation();
                      step(1);
                    }}
                    className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/80 sm:right-6"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <div className="relative z-20 flex items-center justify-center gap-2 overflow-x-auto px-4 py-4">
              {images.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  aria-label={`${title} ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(index);
                  }}
                  className={`relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-[#05070a] ${open === index ? "ring-white" : "ring-transparent opacity-60 hover:opacity-100"}`}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
