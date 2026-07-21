"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export type AdminNavGroup = {
  label: string;
  description?: string;
  icon?: ReactNode;
  items: { href: string; label: string; badge?: number }[];
};

// Admin console navigation: grouped sidebar on desktop (data-dense screens
// are desktop-first, DESIGN section D), scrollable chip row on mobile.
// `badgeLabel` names what every count badge means (a pending-review queue),
// exposed as a tooltip + accessible name so the number is never ambiguous.
export function AdminNav({
  groups,
  badgeLabel,
}: {
  groups: AdminNavGroup[];
  badgeLabel: string;
}) {
  const pathname = usePathname();
  const chipRow = useRef<HTMLElement>(null);
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const describe = (label: string, badge?: number) =>
    badge ? `${label}, ${badge} ${badgeLabel}` : label;

  // With 15+ sections the active chip easily sits off-screen; keep it in
  // view whenever the route changes.
  useEffect(() => {
    chipRow.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <>
      {/* Mobile: chips, pinned under the console header so section jumps
          never require scrolling back to the top of a long queue. */}
      <nav
        ref={chipRow}
        className="scrollbar-none sticky top-[4.6rem] z-20 -mx-4 flex gap-1 overflow-x-auto border-y border-line bg-surface px-4 py-2 lg:hidden"
      >
        {groups
          .flatMap((group) => group.items)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive(item.href) || undefined}
              aria-label={describe(item.label, item.badge)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                isActive(item.href)
                  ? "bg-ink text-white"
                  : "bg-surface-sub text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
              }`}
            >
              {item.label}{item.badge ? <span title={badgeLabel} className="ml-1.5 rounded-full bg-negative px-1.5 py-0.5 text-[10px] font-extrabold text-white">{item.badge > 99 ? "99+" : item.badge}</span> : null}
            </Link>
          ))}
      </nav>

      {/* Desktop: grouped sidebar */}
      <nav className="sticky top-24 hidden self-start overflow-hidden rounded-[1.5rem] bg-[#101923] p-3 text-white shadow-[0_20px_55px_rgba(16,25,35,.15)] lg:block">
        {groups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="flex items-center gap-1.5 px-3 text-xs font-bold uppercase tracking-wider text-white/50">
              {group.icon ? (
                <span aria-hidden="true" className="text-white/40">
                  {group.icon}
                </span>
              ) : null}
              <span>{group.label}</span>
            </p>
            {group.description ? (
              <p className="mt-1 px-3 text-[11px] font-normal normal-case leading-snug tracking-normal text-white/35">
                {group.description}
              </p>
            ) : null}
            <ul className="mt-1.5 space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={describe(item.label, item.badge)}
                    className={`relative block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-white/12 font-semibold text-white before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-[#75aaff]"
                        : "text-white/58 hover:bg-white/7 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2"><span>{item.label}</span>{item.badge ? <span title={badgeLabel} className="min-w-5 rounded-full bg-negative px-1.5 py-0.5 text-center text-[10px] font-extrabold text-white">{item.badge > 99 ? "99+" : item.badge}</span> : null}</span>
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
