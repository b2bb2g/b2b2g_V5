"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keyboard containment for modal overlays: Tab cycles inside the container,
// focus moves in on open and returns to the opener on close. Attach the
// returned ref to the dialog/sheet content element.
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;
    const opener = document.activeElement as HTMLElement | null;

    // Deferred: portals and autoFocus targets mount in the same tick.
    const timer = setTimeout(() => {
      if (container.contains(document.activeElement)) return;
      const first = container.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? container).focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const nodes = [
        ...container.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter(
        (node) =>
          node.offsetParent !== null || node === document.activeElement,
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const outside = !current || !container.contains(current);
      if (event.shiftKey && (outside || current === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (outside || current === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown, true);
      opener?.focus?.();
    };
  }, [active]);
  return ref;
}
