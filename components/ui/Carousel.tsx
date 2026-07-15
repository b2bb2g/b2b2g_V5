"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// Snap carousel. Cards stay aligned with the rest of the page (no side inset);
// prev/next controls overlay the image edges as frosted glass and only appear
// when there is actually somewhere to scroll — left hidden at the start, right
// hidden at the end. Small screens swipe.
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
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scroll(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrowCls =
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white shadow-[0_4px_14px_rgba(0,0,0,.3)] backdrop-blur-md transition duration-200 hover:bg-black/55 active:scale-95 lg:flex";

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
          aria-hidden={atStart}
          className={`${arrowCls} left-2 ${atStart ? "pointer-events-none opacity-0" : "opacity-100"}`}
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
          className="scrollbar-none -mx-4 -my-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 py-6 sm:mx-0 sm:px-0"
        >
          {children}
        </div>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={nextLabel}
          aria-hidden={atEnd}
          className={`${arrowCls} right-2 ${atEnd ? "pointer-events-none opacity-0" : "opacity-100"}`}
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
