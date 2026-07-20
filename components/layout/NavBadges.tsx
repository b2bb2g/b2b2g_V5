"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

// Small always-on "?" chip that flags the FAQ/guide menu for newcomers.
export function FaqHelpDot({ label }: { label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-white"
    >
      ?
    </span>
  );
}

const NOTICES_SEEN_KEY = "b2bb2g:notices-seen-at";
const emptySubscribe = () => () => {};

// Device-local "new notices" dot. It shows when the newest published notice is
// newer than the last time this device opened the notices board; landing on
// /notices marks everything current as read and clears the dot. State lives in
// localStorage (like recent searches), so it needs no account or migration.
// `mounted` gates the localStorage read so SSR and hydration both render nothing
// (no mismatch); the dot only appears after mount.
export function NoticesUnreadDot({
  latestAt,
  href,
  label,
}: {
  latestAt: string | null;
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const onNotices = pathname === href || pathname.startsWith(`${href}/`);
  const latestMs = latestAt ? Date.parse(latestAt) : NaN;

  // Persist "seen" whenever this device is viewing the notices board. This only
  // writes to storage (no state), so navigating away re-reads it and hides the
  // dot on the next render.
  useEffect(() => {
    if (!onNotices || Number.isNaN(latestMs)) return;
    try {
      window.localStorage.setItem(NOTICES_SEEN_KEY, String(latestMs));
    } catch {
      // Best-effort only.
    }
  }, [onNotices, latestMs]);

  if (!mounted || Number.isNaN(latestMs) || onNotices) return null;
  let seen = 0;
  try {
    seen = Number(window.localStorage.getItem(NOTICES_SEEN_KEY)) || 0;
  } catch {
    seen = 0;
  }
  if (seen >= latestMs) return null;

  return (
    <span className="relative flex h-2 w-2" role="status" aria-label={label}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  );
}
