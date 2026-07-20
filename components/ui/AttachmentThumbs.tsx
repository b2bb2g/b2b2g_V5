"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useState, useSyncExternalStore } from "react";
import { useEscape } from "@/lib/use-escape";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { ZoomableImage } from "@/components/ui/ZoomableImage";

// Attachment thumbnails that open a pinch-zoom lightbox (portal: ancestor
// transforms would trap the fixed overlay). Used by inquiry threads and the
// admin review queue.
export function AttachmentThumbs({
  images,
  size = "md",
  closeLabel,
  previousLabel,
  nextLabel,
}: {
  images: string[];
  size?: "sm" | "md";
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  useEscape(index !== null, () => setIndex(null));
  const trap = useFocusTrap<HTMLDivElement>(index !== null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const dimension = size === "sm" ? "h-28 w-28" : "h-32 w-32";

  return (
    <>
      <span className="flex gap-2">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setIndex(i)}
            className="overflow-hidden rounded-xl border border-line/60 transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Image
              src={url}
              alt=""
              width={160}
              height={160}
              className={`${dimension} object-cover`}
            />
          </button>
        ))}
      </span>

      {mounted && index !== null && createPortal(
        <div
          ref={trap}
          tabIndex={-1}
          className="fixed inset-0 z-[250] flex flex-col bg-black/92"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIndex(null);
          }}
        >
          <div className="flex shrink-0 items-center justify-between p-3">
            <p className="px-2 text-xs font-bold text-white/70">
              {images.length > 1 ? `${index + 1} / ${images.length}` : ""}
            </p>
            <button
              type="button"
              onClick={() => setIndex(null)}
              aria-label={closeLabel}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <ZoomableImage
              key={images[index]}
              src={images[index]}
              alt=""
              onDismiss={() => setIndex(null)}
            />
          </div>
          {images.length > 1 && (
            <div className="flex shrink-0 justify-center gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() =>
                  setIndex((index + images.length - 1) % images.length)
                }
                aria-label={previousLabel}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIndex((index + 1) % images.length)}
                aria-label={nextLabel}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
