"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavGroup = {
  label: string;
  items: { href: string; label: string }[];
};

// Admin console navigation: grouped sidebar on desktop (data-dense screens
// are desktop-first, DESIGN section D), scrollable chip row on mobile.
export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile: chips */}
      <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-y border-line bg-surface px-4 py-2 lg:hidden">
        {groups.flatMap((group) => group.items).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              isActive(item.href)
                ? "bg-ink text-white"
                : "bg-surface-sub text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Desktop: grouped sidebar */}
      <nav className="sticky top-24 hidden self-start rounded-2xl border border-line bg-surface p-2 shadow-(--shadow-card) lg:block">
        {groups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              {group.label}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary-soft font-semibold text-primary-strong before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-primary"
                        : "text-ink-soft hover:bg-surface-sub hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
