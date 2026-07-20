"use client";

import { useEffect } from "react";

// Scroll-direction chrome. Scrolling down slides the top header up and any
// bottom action bar down (more room for content / writing); scrolling up,
// pausing, or reaching the top/bottom brings them back. Pure attribute
// toggle on <html>; the transforms and transitions live in CSS so this works
// for server-rendered chrome too, PC and mobile alike.
const DELTA = 6;
const TOP_ZONE = 80;
const BOTTOM_ZONE = 140;
const IDLE_REVEAL_MS = 900;

export function AutoHideChrome() {
  useEffect(() => {
    const root = document.documentElement;
    let lastY = Math.max(0, window.scrollY);
    let ticking = false;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const apply = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      if (Math.abs(delta) < DELTA) return;
      const nearBottom =
        window.innerHeight + y >= root.scrollHeight - BOTTOM_ZONE;
      const hidden = y > TOP_ZONE && !nearBottom && delta > 0;
      root.dataset.chromeHidden = hidden ? "true" : "false";
      lastY = y;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(apply);
      }
      // Always come back when the user stops scrolling.
      clearTimeout(idle);
      idle = setTimeout(() => {
        root.dataset.chromeHidden = "false";
      }, IDLE_REVEAL_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idle);
      delete root.dataset.chromeHidden;
    };
  }, []);

  return null;
}
