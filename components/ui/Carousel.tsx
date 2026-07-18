"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ReactNode,
} from "react";

const EDGE_TOLERANCE = 4;

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
  edgeToEdge = false,
  autoPlayMs,
}: {
  children: ReactNode;
  prevLabel: string;
  nextLabel: string;
  header?: ReactNode;
  action?: ReactNode;
  edgeToEdge?: boolean;
  /** Advance one card on this interval; pauses on hover/touch/focus and off-screen. */
  autoPlayMs?: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!autoPlayMs || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let paused = false;
    let onScreen = true;
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
    });
    io.observe(el);
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("focusin", pause);
    el.addEventListener("focusout", resume);
    const timer = window.setInterval(() => {
      if (paused || !onScreen || document.hidden) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - EDGE_TOLERANCE) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      const cards = el.children;
      const step =
        cards.length > 1
          ? (cards[1] as HTMLElement).offsetLeft -
            (cards[0] as HTMLElement).offsetLeft
          : el.clientWidth * 0.8;
      el.scrollBy({ left: step, behavior: "smooth" });
    }, autoPlayMs);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("focusin", pause);
      el.removeEventListener("focusout", resume);
    };
  }, [autoPlayMs]);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;

    const firstCard = el.firstElementChild;
    const lastCard = el.lastElementChild;
    const viewport = el.getBoundingClientRect();
    const firstCardRect = firstCard?.getBoundingClientRect();
    const lastCardRect = lastCard?.getBoundingClientRect();

    // The edge-to-edge rail keeps symmetric outer padding so the first and
    // last cards can align with the page grid. That padding can leave a small
    // scroll range even when every card is already visible. Controls therefore
    // follow actual card visibility instead of raw scrollLeft/scrollWidth.
    setAtStart(
      !firstCardRect ||
        firstCardRect.left >= viewport.left - EDGE_TOLERANCE,
    );
    setAtEnd(
      !lastCardRect ||
        lastCardRect.right <= viewport.right + EDGE_TOLERANCE,
    );
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    const frame = window.requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    for (const child of el.children) {
      resizeObserver.observe(child);
    }
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scroll(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.min(
      maxScroll,
      Math.max(0, el.scrollLeft + direction * el.clientWidth * 0.8),
    );
    el.scrollTo({ left: target, behavior: "smooth" });
  }

  function scrollToEdge(edge: "start" | "end") {
    const el = track.current;
    if (!el) return;
    el.scrollTo({
      left: edge === "start" ? 0 : Math.max(0, el.scrollWidth - el.clientWidth),
      behavior: "smooth",
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scroll(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scroll(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      scrollToEdge("start");
    } else if (event.key === "End") {
      event.preventDefault();
      scrollToEdge("end");
    }
  }

  const arrowCls = edgeToEdge
    ? "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#e2e2e5]/90 text-[#515154] shadow-[0_2px_10px_rgba(0,0,0,.08)] backdrop-blur-md transition duration-200 hover:bg-[#d6d6da] active:scale-95 lg:flex"
    : "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white shadow-[0_4px_14px_rgba(0,0,0,.3)] backdrop-blur-md transition duration-200 hover:bg-black/55 active:scale-95 lg:flex";
  const arrowInset = edgeToEdge ? "lg:left-6" : "left-2";
  const nextArrowInset = edgeToEdge ? "lg:right-6" : "right-2";
  const trackClassName = edgeToEdge
    ? "store-shelf-track scrollbar-none -my-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth py-6"
    : "scrollbar-none -mx-4 -my-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 py-6 sm:mx-0 sm:px-0";

  return (
    <div>
      {(header || action) && (
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">{header}</div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div
        className={
          edgeToEdge
            ? "relative left-1/2 w-screen -translate-x-1/2"
            : "relative"
        }
      >
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label={prevLabel}
          aria-hidden={atStart}
          disabled={atStart}
          className={`${arrowCls} ${arrowInset} ${atStart ? "pointer-events-none opacity-0" : "opacity-100"}`}
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
          data-carousel-track
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={`${trackClassName} rounded-[var(--store-card-radius)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary`}
        >
          {children}
        </div>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={nextLabel}
          aria-hidden={atEnd}
          disabled={atEnd}
          className={`${arrowCls} ${nextArrowInset} ${atEnd ? "pointer-events-none opacity-0" : "opacity-100"}`}
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
