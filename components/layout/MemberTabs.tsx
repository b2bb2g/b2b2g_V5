"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Member-area tab bar: one navigation grammar across dashboard, inquiries
// and notifications (mirrors the admin chip nav).
export function MemberTabs({
  items,
}: {
  // `countLabel` names what a tab's count means (this area mixes "in review"
  // and "unread"), surfaced as a tooltip + accessible name.
  items: {
    href: string;
    label: string;
    count?: number;
    countLabel?: string;
    // `emphasis` marks a cross-area link (e.g. the admin console) so it reads
    // as distinct from the member tabs.
    emphasis?: boolean;
  }[];
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
          aria-label={
            item.count && item.countLabel
              ? `${item.label}, ${item.count} ${item.countLabel}`
              : undefined
          }
          className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all lg:w-full ${
            item.emphasis ? "lg:mt-1 lg:border-t lg:border-line lg:pt-3.5" : ""
          } ${
            isActive(item.href)
              ? "bg-[#101923] text-white shadow-sm"
              : item.emphasis
                ? "text-primary-strong hover:bg-primary-soft"
                : "text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
          }`}
        >
          <span className="flex items-center gap-1.5">
            {item.emphasis && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2 4 5v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V5l-8-3Z" />
              </svg>
            )}
            {item.label}
          </span>
          {!!item.count && (
            <span
              title={item.countLabel}
              className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-extrabold ${
                isActive(item.href)
                  ? "bg-white/15 text-white"
                  : "bg-primary-soft text-primary"
              }`}
            >
              {item.count > 99 ? "99+" : item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
