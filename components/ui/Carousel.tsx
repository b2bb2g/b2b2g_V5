"use client";

import { useRef, type ReactNode } from "react";

// Snap carousel with arrow controls; children are server-rendered cards.
export function Carousel({
  children,
  prevLabel,
  nextLabel,
}: {
  children: ReactNode;
  prevLabel: string;
  nextLabel: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrowCls =
    "hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-(--shadow-card) transition-colors hover:bg-surface-sub sm:flex";

  return (
    <div className="relative">
      <div
        ref={track}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 sm:mx-0 sm:px-0"
      >
        {children}
      </div>
      <div className="absolute -top-14 right-0 flex gap-2">
        <button type="button" onClick={() => scroll(-1)} aria-label={prevLabel} className={arrowCls}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label={nextLabel} className={arrowCls}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
