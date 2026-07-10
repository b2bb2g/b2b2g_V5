"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Member-area tab bar: one navigation grammar across dashboard, inquiries
// and notifications (mirrors the admin chip nav).
export function MemberTabs({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 pb-3">
      {items.map((item) => (
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
  );
}
