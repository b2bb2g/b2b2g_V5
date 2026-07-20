"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Global per-link navigation feedback. On a click that starts an internal
// navigation, the clicked <a> gets [data-nav-pending] — CSS then dims it, shows
// an inline spinner and blocks pointer events (so a second click can't re-fire).
// The mark clears once the route settles. Links that render their own pending
// visual opt out with [data-nav-overlay]. No per-link wiring needed.
export function NavPending() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document
      .querySelectorAll("a[data-nav-pending]")
      .forEach((el) => el.removeAttribute("data-nav-pending"));
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        anchor.getAttribute("target") === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      let dest: URL;
      try {
        dest = new URL(href, window.location.href);
      } catch {
        return;
      }
      // Only same-origin navigations to a different URL show pending.
      if (dest.origin !== window.location.origin) return;
      if (
        dest.pathname === window.location.pathname &&
        dest.search === window.location.search
      ) {
        return;
      }
      anchor.setAttribute("data-nav-pending", "true");
      // Safety net: if this click didn't actually navigate (e.g. an onClick
      // handler cancelled it), clear the mark so the link never stays stuck.
      window.setTimeout(() => anchor.removeAttribute("data-nav-pending"), 6000);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
