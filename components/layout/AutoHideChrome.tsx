"use client";

import { useEffect } from "react";

// Scroll-direction chrome. Scrolling down slides the top header up and any
// bottom action bar down; scrolling back up, or reaching the top/bottom,
// brings them back. Uses accumulated-distance hysteresis so it commits to a
// direction instead of flipping on every few pixels (that jitter is what
// made it feel stiff on phones, especially with momentum scrolling). Pure
// attribute toggle on <html>; transforms/transitions live in CSS.
const HIDE_AFTER = 52; // cumulative downward px before hiding
const SHOW_AFTER = 36; // cumulative upward px before showing
const TOP_ZONE = 64;
const BOTTOM_ZONE = 120;

export function AutoHideChrome() {
  useEffect(() => {
    const root = document.documentElement;
    let lastY = Math.max(0, window.scrollY);
    let acc = 0; // signed distance since the last direction change
    let hidden = false;
    let ticking = false;

    const setHidden = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      root.dataset.chromeHidden = next ? "true" : "false";
    };

    const apply = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      lastY = y;
      if (delta === 0) return;

      // Always show at the very top and near the bottom (so the submit bar
      // and top nav are reachable without fighting the gesture).
      const nearBottom =
        window.innerHeight + y >= root.scrollHeight - BOTTOM_ZONE;
      if (y <= TOP_ZONE || nearBottom) {
        acc = 0;
        setHidden(false);
        return;
      }

      // Reset the accumulator whenever the scroll direction flips.
      if (delta > 0 !== acc > 0) acc = 0;
      acc += delta;

      if (acc > HIDE_AFTER) setHidden(true);
      else if (acc < -SHOW_AFTER) setHidden(false);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(apply);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      delete root.dataset.chromeHidden;
    };
  }, []);

  return null;
}
