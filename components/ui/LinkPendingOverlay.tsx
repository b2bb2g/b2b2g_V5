"use client";

import { useLinkStatus } from "next/link";

// Drop inside a Next <Link> (which must be `relative`): while that link's
// navigation is in flight it covers the card with a spinner, so an action
// button gives immediate feedback instead of looking frozen, and a second
// click lands on the veil instead of re-firing.
export function LinkPendingOverlay() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-ink/10 backdrop-blur-[1px]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(16,25,35,.18)]">
        <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" />
      </span>
    </span>
  );
}
