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
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-y border-line bg-white px-4 py-2 sm:mx-0 sm:rounded-2xl sm:border sm:p-2 sm:shadow-(--shadow-card) lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:rounded-[1.5rem] lg:p-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all lg:w-full ${
            isActive(item.href)
              ? "bg-[#101923] text-white shadow-sm"
              : "text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
