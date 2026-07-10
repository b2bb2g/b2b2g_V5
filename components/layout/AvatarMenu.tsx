"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";

export type AvatarMenuItem = { href: string; label: string };

// Profile dropdown: opens on hover (desktop) or tap (touch), closes when the
// pointer leaves the trigger+panel area or on navigation.
export function AvatarMenu({
  name,
  subtitle,
  items,
  signOutLabel,
}: {
  name: string;
  subtitle: string;
  items: AvatarMenuItem[];
  signOutLabel: string;
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
    <div
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white ring-2 ring-transparent transition-shadow hover:ring-primary-soft"
      >
        {name.slice(0, 1).toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-(--shadow-float)"
          style={{ animationDuration: "0.25s" }}
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-faint">{subtitle}</p>
          </div>
          <nav className="p-1.5">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-sub hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="border-t border-line p-1.5">
            <button
              type="submit"
              role="menuitem"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-negative transition-colors hover:bg-negative-soft"
            >
              {signOutLabel}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
