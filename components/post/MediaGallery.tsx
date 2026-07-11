"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
}: {
  images: string[];
  heroIndex: number;
  showHero: boolean;
  title: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      setOpen((current) =>
        current === null
          ? current
          : (current + delta + images.length) % images.length
      );
    },
    [images.length]
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  if (images.length === 0) return null;

  return (
    <>
      {showHero && (
        <button
          type="button"
          onClick={() => setOpen(heroIndex)}
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
      )}

      {images.length > 1 && (
        <div className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setOpen(index)}
              className="relative aspect-square w-40 shrink-0 cursor-zoom-in snap-start overflow-hidden rounded-xl bg-surface-sub"
            >
              <Image src={url} alt="" fill sizes="160px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
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
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-semibold tabular-nums">
              {open + 1} / {images.length}
            </span>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={() => setOpen(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
          <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[open]}
              alt={title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-6 px-4 py-4">
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button
                  type="button"
                  aria-label="next"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
