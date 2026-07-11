"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 70;
const MAX_PULL = 110;

// App-standard pull-to-refresh (PRD 18.3): pulling down from the very top of
// the page re-fetches the current route's server data. Touch-only by nature;
// desktop scrolling never reaches the gesture.
export function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [isPending, startTransition] = useTransition();
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    function onTouchStart(event: TouchEvent) {
      startY.current = window.scrollY <= 0 ? (event.touches[0]?.clientY ?? null) : null;
    }
    function onTouchMove(event: TouchEvent) {
      if (startY.current === null || window.scrollY > 0) return;
      const delta = (event.touches[0]?.clientY ?? 0) - startY.current;
      const next = delta > 0 ? Math.min(delta * 0.45, MAX_PULL) : 0;
      pullRef.current = next;
      setPull(next);
    }
    function onTouchEnd() {
      if (pullRef.current > THRESHOLD) {
        startTransition(() => router.refresh());
      }
      startY.current = null;
      pullRef.current = 0;
      setPull(0);
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [router, startTransition]);

  const visible = pull > 4 || isPending;
  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center"
      style={{ transform: `translateY(${isPending ? 24 : Math.min(pull, MAX_PULL) * 0.5}px)` }}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ${
          isPending ? "" : "transition-transform"
        }`}
        style={{ opacity: isPending ? 1 : Math.min(pull / THRESHOLD, 1) }}
      >
        <span
          className={`h-4 w-4 rounded-full border-2 border-primary border-t-transparent ${
            isPending ? "animate-spin" : ""
          }`}
          style={
            isPending
              ? undefined
              : { transform: `rotate(${(pull / THRESHOLD) * 270}deg)` }
          }
        />
      </span>
    </div>
  );
}
