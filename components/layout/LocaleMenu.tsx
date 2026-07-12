"use client";

import { useRef, useState } from "react";
import { setLocale } from "@/app/actions/locale";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/constants";
import { PendingButton } from "@/components/ui/PendingButton";

// Globe language switcher: same interaction grammar as the avatar menu
// (hover to open, auto-close on pointer leave, tap toggle on touch).
export function LocaleMenu({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function leave() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="rounded-full p-2 text-ink-soft transition-colors hover:bg-surface-sub"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-(--shadow-float)"
          style={{ animationDuration: "0.25s" }}
        >
          {/* The menu must stay mounted until the action finishes -- closing
              onClick unmounts the form and the submit never fires. */}
          <form
            action={async (formData: FormData) => {
              await setLocale(formData);
              setOpen(false);
            }}
          >
            {LOCALES.map((l) => (
              <PendingButton
                key={l}
                name="locale"
                value={l}
                role="menuitem"
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  l === locale
                    ? "bg-primary-soft text-primary-strong"
                    : "text-ink-soft hover:bg-surface-sub hover:text-ink"
                }`}
              >
                {LOCALE_LABELS[l]}
                {l === locale && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </PendingButton>
            ))}
          </form>
        </div>
      )}
    </div>
  );
}
