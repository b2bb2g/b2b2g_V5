"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { setLocale } from "@/app/actions/locale";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/constants";
import { PendingButton } from "@/components/ui/PendingButton";

// Slide-in navigation drawer for phone and tablet. Rendered through a portal:
// the sticky header's backdrop-blur creates a containing block that would trap
// fixed-position children inside the header box.
const emptySubscribe = () => () => {};

export function MobileMenu({
  items,
  locale,
  languageLabel,
  searchLabel,
  signInLabel,
  signUpLabel,
  menuLabel,
  closeLabel,
  showAuth = true,
}: {
  items: { id: string; slug: string; label: string }[];
  locale: Locale;
  languageLabel: string;
  searchLabel: string;
  signInLabel?: string;
  signUpLabel?: string;
  menuLabel: string;
  closeLabel: string;
  // Signed-in members reach account actions through the avatar menu, so the
  // drawer only needs board links, search and language for them.
  showAuth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const close = () => setOpen(false);

  // Lock page scroll while the drawer is open; Escape closes it.
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drawer = (
    <>
      <div
        className={`fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={menuLabel}
        className={`fixed inset-y-0 right-0 z-50 flex w-[19.5rem] max-w-[86vw] flex-col rounded-l-[1.5rem] bg-surface shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[4.5rem] shrink-0 items-center justify-between pl-5 pr-3">
          <p className="text-sm font-extrabold uppercase tracking-[.14em] text-ink-faint">
            {menuLabel}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-sub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="px-4 pb-3">
          <Link
            href="/search"
            onClick={close}
            className="flex items-center gap-2.5 rounded-xl bg-surface-sub px-3.5 py-2.5 text-sm font-semibold text-ink-faint transition-colors hover:text-ink-soft"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {searchLabel}
          </Link>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const href = `/${item.slug}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-[15px] font-bold transition-colors ${
                      active
                        ? "bg-primary-soft text-primary-strong"
                        : "text-ink hover:bg-surface-sub"
                    }`}
                  >
                    {item.label}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={active ? "text-primary" : "text-ink-faint/60"}>
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-line px-5 py-3">
          <form action={setLocale} className="flex items-center justify-between gap-3">
            <span className="flex items-center text-ink-faint">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span className="sr-only">{languageLabel}</span>
            </span>
            <div className="flex rounded-full bg-surface-sub p-0.5">
              {LOCALES.map((l) => (
                <PendingButton
                  key={l}
                  name="locale"
                  value={l}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                    l === locale
                      ? "bg-white text-ink shadow-[0_1px_5px_rgba(25,31,40,.14)]"
                      : "text-ink-faint hover:text-ink-soft"
                  }`}
                >
                  {LOCALE_LABELS[l]}
                </PendingButton>
              ))}
            </div>
          </form>
        </div>

        <div className="shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          {showAuth ? (
            <div className="grid gap-2">
              <Link href="/signup" onClick={close} className="btn-primary btn-md w-full rounded-xl">
                {signUpLabel}
              </Link>
              <Link href="/login" onClick={close} className="btn-secondary btn-md w-full rounded-xl">
                {signInLabel}
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft hover:bg-surface-sub"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        aria-haspopup="dialog"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {mounted && createPortal(drawer, document.body)}
    </div>
  );
}
