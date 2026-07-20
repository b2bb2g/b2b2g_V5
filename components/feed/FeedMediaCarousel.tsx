"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { postMediaUrl } from "@/lib/media";
import { ZoomableImage } from "@/components/ui/ZoomableImage";

export function FeedMediaCarousel({
  paths,
  activeIndex,
  onActiveIndexChange,
  openImageLabel,
  previousLabel,
  nextLabel,
  onDismiss,
}: {
  paths: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  openImageLabel: string;
  previousLabel: string;
  nextLabel: string;
  /** Vertical swipe-down (not zoomed) closes the surrounding viewer. */
  onDismiss?: () => void;
}) {
  const pointerStart = useRef<{
    x: number;
    y: number;
    id: number;
  } | null>(null);
  const zoomedRef = useRef(false);
  const suppressClick = useRef(false);
  const pointerType = useRef<string | null>(null);
  const [loadedPaths, setLoadedPaths] = useState<Set<string>>(() => new Set());

  const step = (delta: number) => {
    onActiveIndexChange(
      (activeIndex + delta + paths.length) % paths.length,
    );
  };

  if (!paths.length) return null;

  return (
    // min-w-0: the thumbnail strip's natural width (n x 48px) must never
    // push a phone-width dialog wider than the viewport.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#07090d] text-white">
      <div className="relative min-h-0 flex-1 py-3 sm:px-12 sm:py-5">
        <div
          data-feed-media-stage
          className={`relative mx-auto h-full w-full select-none overflow-hidden sm:max-w-[min(78vw,88rem)] sm:rounded-xl ${paths.length > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
          onPointerDown={(event) => {
            if (zoomedRef.current || (paths.length < 2 && !onDismiss) || (event.pointerType === "mouse" && event.button !== 0)) {
              return;
            }
            pointerType.current = event.pointerType;
            pointerStart.current = {
              x: event.clientX,
              y: event.clientY,
              id: event.pointerId,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current;
            pointerStart.current = null;
            if (zoomedRef.current || !start || start.id !== event.pointerId) {
              return;
            }
            const deltaX = event.clientX - start.x;
            const deltaY = event.clientY - start.y;
            if (paths.length > 1 && Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
              suppressClick.current = true;
              step(deltaX > 0 ? -1 : 1);
            } else if (onDismiss && deltaY > 90 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2 && pointerType.current !== "mouse") {
              suppressClick.current = true;
              onDismiss();
            }
          }}
          onPointerCancel={() => {
            pointerStart.current = null;
          }}
          onClick={(event) => {
            if (suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            if (paths.length < 2 || pointerType.current !== "mouse") return;
            const bounds = event.currentTarget.getBoundingClientRect();
            step(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
          }}
        >
          {!loadedPaths.has(paths[activeIndex]) && (
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-white/80"
            />
          )}
          <ZoomableImage
            src={postMediaUrl(paths[activeIndex])}
            alt={`${openImageLabel} ${activeIndex + 1} / ${paths.length}`}
            loaded={loadedPaths.has(paths[activeIndex])}
            onZoomChange={(zoomed) => {
              zoomedRef.current = zoomed;
            }}
            onLoad={() => {
              setLoadedPaths((current) => {
                if (current.has(paths[activeIndex])) return current;
                const next = new Set(current);
                next.add(paths[activeIndex]);
                return next;
              });
            }}
          />

          {paths.length > 1 && (
            <>
              <button
                type="button"
                data-feed-media-previous
                aria-label={previousLabel}
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
              >
                <Chevron direction="left" />
              </button>
              <button
                type="button"
                data-feed-media-next
                aria-label={nextLabel}
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
              >
                <Chevron direction="right" />
              </button>
            </>
          )}
        </div>
      </div>

      {paths.length > 1 && (
        <div
          data-feed-media-thumbnails
          className="flex shrink-0 justify-start gap-2 overflow-x-auto border-t border-white/10 px-3 py-2.5 sm:justify-center sm:px-6"
        >
          {paths.map((path, index) => (
            <button
              type="button"
              key={`${path}-${index}`}
              aria-label={`${openImageLabel} ${index + 1} / ${paths.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => onActiveIndexChange(index)}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-14 sm:w-14 ${index === activeIndex ? "border-white" : "border-transparent opacity-55 hover:opacity-100"}`}
            >
              <Image
                src={postMediaUrl(path)}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
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
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}
