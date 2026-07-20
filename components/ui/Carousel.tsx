"use client";

import {
  Children,
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ReactNode,
} from "react";

const EDGE_TOLERANCE = 4;
// Marquee cruising speed (px/second). Slow and continuous, like a gentle
// current; a card is ~280px so it drifts past in ~9 seconds.
const MARQUEE_PX_PER_SEC = 30;

// Snap carousel. Cards stay aligned with the rest of the page (no side inset);
// prev/next controls overlay the image edges as frosted glass and only appear
// when there is actually somewhere to scroll — left hidden at the start, right
// hidden at the end. Small screens swipe.
//
// `marquee` turns it into a gently auto-scrolling ribbon: every card is
// rendered exactly once (no duplicated set, so a listing never reads as
// appearing twice) and the track drifts back and forth, reversing at each
// end. It pauses on hover / touch / focus, off-screen, when the tab is hidden,
// and under reduced-motion.
export function Carousel({
  children,
  prevLabel,
  nextLabel,
  header,
  action,
  edgeToEdge = false,
  marquee = false,
}: {
  children: ReactNode;
  prevLabel: string;
  nextLabel: string;
  header?: ReactNode;
  action?: ReactNode;
  edgeToEdge?: boolean;
  /** Continuous seamless auto-scroll; pauses on hover/touch/focus/off-screen. */
  marquee?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  // Marquee only actually runs when one set of cards overflows the viewport —
  // otherwise the duplicate set would sit visibly beside the originals (the
  // "same card twice" bug on short rails). Starts false so SSR and first
  // client render match; a measure effect flips it on when needed.
  const [run, setRun] = useState(false);

  const items = Children.toArray(children);

  // Decide whether the marquee should run: measure the first set's width
  // (works with or without the duplicate already present) against the
  // viewport, and re-check on resize.
  useEffect(() => {
    const el = track.current;
    if (!marquee || !el) {
      setRun(false);
      return;
    }
    const measure = () => {
      setRun(el.scrollWidth > el.clientWidth + 8);
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [marquee, items.length]);

  // Ping-pong auto-scroll: drift scrollLeft and reverse direction at each end.
  // Every card is rendered once (no duplicated set), so the listing count the
  // viewer sees always equals the real number of items.
  useEffect(() => {
    const el = track.current;
    if (!run || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let paused = false;
    let onScreen = true;
    let raf = 0;
    let last: number | null = null;
    let dir = 1;

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
    el.addEventListener("pointerup", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);
    el.addEventListener("focusin", pause);
    el.addEventListener("focusout", resume);

    const frame = (now: number) => {
      raf = window.requestAnimationFrame(frame);
      if (last === null) last = now;
      const dt = (now - last) / 1000;
      last = now;
      if (paused || !onScreen || document.hidden) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) return;
      let next = el.scrollLeft + dir * MARQUEE_PX_PER_SEC * dt;
      if (next >= max) {
        next = max;
        dir = -1;
      } else if (next <= 0) {
        next = 0;
        dir = 1;
      }
      el.scrollLeft = next;
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("pointerup", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
      el.removeEventListener("focusin", pause);
      el.removeEventListener("focusout", resume);
    };
  }, [run]);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;

    const firstCard = el.firstElementChild;
    const lastCard = el.lastElementChild;
    const viewport = el.getBoundingClientRect();
    const firstCardRect = firstCard?.getBoundingClientRect();
    const lastCardRect = lastCard?.getBoundingClientRect();

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
    if (marquee) return; // arrows are not used in marquee mode
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
  }, [update, marquee]);

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
  // Marquee scrolls itself, so it drops snap/smooth (which would fight the
  // per-frame drift) and hides the manual arrows.
  const baseTrack = edgeToEdge
    ? "store-shelf-track scrollbar-none -my-6 flex gap-5 overflow-x-auto py-6"
    : "scrollbar-none -mx-4 -my-6 flex gap-4 overflow-x-auto px-4 py-6 sm:mx-0 sm:px-0";
  const trackClassName = marquee
    ? baseTrack
    : `${baseTrack} snap-x snap-mandatory scroll-smooth`;

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
        {!marquee && (
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={prevLabel}
            aria-hidden={atStart}
            disabled={atStart}
            className={`${arrowCls} ${arrowInset} ${atStart ? "pointer-events-none opacity-0" : "opacity-100"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <div
          ref={track}
          data-carousel-track
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={`${trackClassName} rounded-[var(--store-card-radius)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary`}
        >
          {items}
        </div>
        {!marquee && (
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={nextLabel}
            aria-hidden={atEnd}
            disabled={atEnd}
            className={`${arrowCls} ${nextArrowInset} ${atEnd ? "pointer-events-none opacity-0" : "opacity-100"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
