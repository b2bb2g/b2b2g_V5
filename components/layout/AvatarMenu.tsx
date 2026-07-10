"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";

export type AvatarMenuItem = { href: string; label: string };

// Profile dropdown: opens on hover (desktop) or tap (touch), closes when the
// pointer leaves the trigger+panel area or after navigation. The member's
// primary identifier is the UID (copyable), not the email.
export function AvatarMenu({
  name,
  uid,
  avatarUrl,
  items,
  signOutLabel,
  copyLabel,
  copiedLabel,
}: {
  name: string;
  uid: number;
  avatarUrl: string | null;
  items: AvatarMenuItem[];
  signOutLabel: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function leave() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }
  async function copyUid() {
    await navigator.clipboard.writeText(String(uid));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const avatar = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={name}
      width={36}
      height={36}
      className="h-9 w-9 rounded-full object-cover"
    />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full ring-2 ring-transparent transition-shadow hover:ring-primary-soft"
      >
        {avatar}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-(--shadow-float)"
          style={{ animationDuration: "0.25s" }}
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            {avatar}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{name}</p>
              <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                UID {uid}
                <button
                  type="button"
                  onClick={copyUid}
                  aria-label={copied ? copiedLabel : copyLabel}
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-faint transition-colors hover:bg-surface-sub hover:text-ink-soft"
                >
                  {copied ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-positive" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  )}
                </button>
              </span>
            </div>
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
