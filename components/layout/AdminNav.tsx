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
      <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:hidden">
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
      <nav className="sticky top-24 hidden self-start lg:block">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              {group.label}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary-soft font-semibold text-primary-strong"
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
