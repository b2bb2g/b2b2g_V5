"use client";

import { usePathname } from "next/navigation";

// Plain-language "what is this screen / what do I do here" banner, rendered once
// by the admin layout above the page content. Keyed by route so every admin
// section gets a beginner-friendly hint without touching each page (their own
// title stays; this only adds the guidance sentence).
export function AdminSectionHint({ hints }: { hints: Record<string, string> }) {
  const pathname = usePathname();
  const key = Object.keys(hints)
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .sort((a, b) => b.length - a.length)[0];
  const hint = key ? hints[key] : null;
  if (!hint) return null;
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary-soft/25 px-4 py-2.5 text-xs leading-relaxed text-ink-soft">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-px shrink-0 text-primary"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </svg>
      <span>{hint}</span>
    </div>
  );
}
