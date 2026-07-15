"use client";

import { useRef, type ReactNode } from "react";

// Snap carousel. The header holds the title + an optional "view all" action;
// prev/next controls sit vertically centred in the side gutters (desktop) so
// they never cover a card image. On smaller screens users swipe instead.
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
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-[0_6px_20px_rgba(25,31,40,.14)] transition hover:border-primary/40 hover:text-primary active:scale-95 lg:flex";

  return (
    <div>
      {(header || action) && (
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">{header}</div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label={prevLabel}
          className={`${arrowCls} left-0`}
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
        <div
          ref={track}
          className="scrollbar-none -mx-4 -my-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 py-6 sm:mx-0 sm:px-0 lg:px-14 lg:[scroll-padding-left:3.5rem] lg:[scroll-padding-right:3.5rem]"
        >
          {children}
        </div>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={nextLabel}
          className={`${arrowCls} right-0`}
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
  );
}
