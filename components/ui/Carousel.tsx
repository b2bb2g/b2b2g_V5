"use client";

import { useRef, type ReactNode } from "react";

// Snap carousel with arrow controls. An optional header/action render in a top
// row alongside the arrows so nothing overlaps, and the track carries padding
// so a card's hover lift and shadow are never clipped by the scroller.
export function Carousel({
  children,
  prevLabel,
  nextLabel,
  header,
  action,
}: {
  children: ReactNode;
  prevLabel: string;
  nextLabel: string;
  header?: ReactNode;
  action?: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrowCls =
    "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-(--shadow-card) transition-colors hover:border-primary/40 hover:bg-surface-sub hover:text-ink";

  return (
    <div>
      {(header || action) && (
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">{header}</div>
          <div className="flex shrink-0 items-center gap-4">
            {action}
            {action && (
              <span
                className="hidden h-5 w-px bg-line sm:block"
                aria-hidden="true"
              />
            )}
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scroll(-1)}
                aria-label={prevLabel}
                className={arrowCls}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                aria-label={nextLabel}
                className={arrowCls}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Horizontal alignment matches every other section (no desktop bleed);
          the -my-6/py-6 pair gives the cards' hover lift and shadow room to
          breathe without adding height or shifting the layout. */}
      <div
        ref={track}
        className="scrollbar-none -mx-4 -my-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 py-6 sm:mx-0 sm:px-0"
      >
        {children}
      </div>
    </div>
  );
}
