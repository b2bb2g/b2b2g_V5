"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function MobileMenu({
  items,
  searchLabel,
  signInLabel,
  signUpLabel,
}: {
  items: { id: string; slug: string; label: string }[];
  searchLabel: string;
  signInLabel: string;
  signUpLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft hover:bg-surface-sub"
        aria-label="Menu"
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 z-50 border-b border-line bg-surface px-4 pb-5 pt-3 shadow-(--shadow-float)">
          <nav className="grid gap-1">
            {items.map((item) => {
              const href = `/${item.slug}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={item.id} href={href} onClick={close} className={`rounded-xl px-3 py-3 text-sm font-bold ${active ? "bg-primary-soft text-primary-strong" : "text-ink-soft hover:bg-surface-sub"}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-4">
            <Link href="/search" onClick={close} className="btn-secondary btn-md">{searchLabel}</Link>
            <Link href="/login" onClick={close} className="btn-secondary btn-md">{signInLabel}</Link>
            <Link href="/signup" onClick={close} className="btn-primary btn-md col-span-2">{signUpLabel}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
