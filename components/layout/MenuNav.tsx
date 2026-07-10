"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Dynamic menu row with active-state highlighting. Menus are admin-managed
// and variable in count, so the row scrolls horizontally when it overflows.
export function MenuNav({
  items,
}: {
  items: { id: string; slug: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 pb-2.5">
      {items.map((item) => {
        const href = `/${item.slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={item.id}
            href={href}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-ink text-white"
                : "bg-surface-sub text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
