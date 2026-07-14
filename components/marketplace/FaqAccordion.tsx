"use client";

import { useMemo, useState } from "react";

export type FaqItem = {
  id: string;
  question: string;
  answer: string; // pre-sanitized HTML
  plain: string; // stripped text, for search
};

// Modern SaaS-style FAQ: an instant filter over a single card of expandable
// questions. Answers arrive already sanitized from the server.
export function FaqAccordion({
  items,
  searchPlaceholder,
  emptyLabel,
  clearLabel,
}: {
  items: FaqItem[];
  searchPlaceholder: string;
  emptyLabel: string;
  clearLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.question} ${i.plain}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-faint">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-2xl border border-line bg-white py-3.5 pl-11 pr-11 text-sm shadow-(--shadow-card) outline-none transition-colors focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={clearLabel}
            className="absolute inset-y-0 right-3 flex items-center text-ink-faint hover:text-ink-soft"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white px-5 py-12 text-center text-sm text-ink-faint shadow-(--shadow-card)">
          {emptyLabel}
        </p>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line/70 bg-white shadow-(--shadow-card)">
          {filtered.map((item) => {
            const isOpen = open === item.id;
            return (
              <div key={item.id}>
                <h2>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-sub/50 sm:px-6"
                  >
                    <span className="text-sm font-extrabold text-ink sm:text-base">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft transition-transform ${
                        isOpen ? "rotate-180 bg-primary-soft text-primary-strong" : "bg-surface-sub"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                </h2>
                {isOpen && (
                  <div
                    className="px-5 pb-5 text-sm leading-6 text-ink-soft [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_p+p]:mt-3 sm:px-6"
                    dangerouslySetInnerHTML={{ __html: item.answer }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
