"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Global top loading bar. Starts optimistically on link clicks and GET form
// submits; finishes on every signal that a navigation settled. The finish
// side must over-trigger rather than under-trigger: a bar that never stops
// reads as a broken site.
const START_DELAY_MS = 100;
const FAILSAFE_MS = 8000;

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (startTimer.current) clearTimeout(startTimer.current);
    if (failsafeTimer.current) clearTimeout(failsafeTimer.current);
    startTimer.current = null;
    failsafeTimer.current = null;
    setPending(false);
  }, []);

  // Route commit: the pathname or query changed.
  useEffect(() => {
    finish();
  }, [pathname, searchParams, finish]);

  useEffect(() => {
    function start() {
      if (startTimer.current) clearTimeout(startTimer.current);
      if (failsafeTimer.current) clearTimeout(failsafeTimer.current);
      startTimer.current = setTimeout(() => setPending(true), START_DELAY_MS);
      failsafeTimer.current = setTimeout(finish, FAILSAFE_MS);
    }
    function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.download || anchor.origin !== location.origin) return;
      const next = new URL(anchor.href);
      if (`${next.pathname}${next.search}` !== `${location.pathname}${location.search}`) start();
    }
    function submit(event: SubmitEvent) {
      // Server-action forms render method="POST" and manage their own button
      // pending state; only classic GET forms navigate.
      const form = event.target as HTMLFormElement;
      if ((form.method || "get").toLowerCase() === "get") start();
    }

    // Same-URL redirects (e.g. a failed sign-in bouncing back to the same
    // query) commit through history without changing pathname/searchParams,
    // so hook the history API as an additional finish signal.
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<History["pushState"]>) => {
      originalPush(...args);
      finish();
    };
    history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      originalReplace(...args);
      finish();
    };
    window.addEventListener("popstate", finish);
    window.addEventListener("pageshow", finish);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener("popstate", finish);
      window.removeEventListener("pageshow", finish);
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
      if (startTimer.current) clearTimeout(startTimer.current);
      if (failsafeTimer.current) clearTimeout(failsafeTimer.current);
    };
  }, [finish]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden transition-opacity duration-200 ${pending ? "opacity-100" : "opacity-0"}`}
      role="progressbar"
      aria-label="Loading"
      aria-hidden={!pending}
    >
      <span className="block h-full w-2/5 animate-navigation-progress rounded-r-full bg-primary shadow-[0_0_12px_2px_rgba(27,100,218,.55)]" />
    </div>
  );
}
