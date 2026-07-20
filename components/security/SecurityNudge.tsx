"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState, useSyncExternalStore } from "react";
import { biometricAvailable, readAppLock } from "@/lib/app-lock";
import { FingerprintIcon } from "@/components/security/FingerprintIcon";

// One-time prompt encouraging members to turn on the device app lock.
// Shows only when: signed in, lock not already enabled, not dismissed, and
// not already on the security page. Snoozes for a week on "Later" and never
// returns after "Don't show again" — a nudge, never a nag.
const SNOOZE_KEY = "b2bb2g:security-nudge-snooze";
const NEVER_KEY = "b2bb2g:security-nudge-off";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

type Labels = {
  title: string;
  body: string;
  bodyPin: string;
  setup: string;
  later: string;
  never: string;
};

export function SecurityNudge({ labels }: { labels: Labels }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/dashboard/security")) return;
    const timer = setTimeout(async () => {
      try {
        if (readAppLock()) return; // already protected
        if (window.localStorage.getItem(NEVER_KEY)) return;
        const snoozed = Number(window.localStorage.getItem(SNOOZE_KEY) ?? "0");
        if (snoozed && Date.now() < snoozed) return;
      } catch {
        return;
      }
      setHasBiometric(await biometricAvailable());
      // Let the page settle first; a nudge on top of a still-loading screen
      // reads as an error dialog.
      setTimeout(() => setOpen(true), 1600);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Portals need the DOM; render nothing until mounted on the client.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted || !open) return null;

  const snooze = () => {
    try {
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      // Best-effort only.
    }
    setOpen(false);
  };
  const never = () => {
    try {
      window.localStorage.setItem(NEVER_KEY, "1");
    } catch {
      // Best-effort only.
    }
    setOpen(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) snooze();
      }}
    >
      <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"
          aria-hidden="true"
        >
          <FingerprintIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold tracking-[-.02em]">
          {labels.title}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">
          {hasBiometric ? labels.body : labels.bodyPin}
        </p>
        <Link
          href="/dashboard/security#app-lock"
          onClick={() => setOpen(false)}
          className="btn-primary btn-md mt-5 w-full"
        >
          {labels.setup}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={snooze}
            className="rounded-lg px-3 py-2 text-sm font-bold text-ink-soft transition-colors hover:text-ink"
          >
            {labels.later}
          </button>
          <button
            type="button"
            onClick={never}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-ink-faint transition-colors hover:text-ink-soft"
          >
            {labels.never}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
