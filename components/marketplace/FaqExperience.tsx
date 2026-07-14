"use client";

import { useMemo, useState } from "react";

export type FaqItem = {
  id: string;
  question: string;
  answer: string; // pre-sanitized HTML
  plain: string; // stripped text, for search
};

const answerClass =
  "text-[15px] leading-7 text-ink-soft [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_p+p]:mt-3.5 [&_strong]:font-bold [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:space-y-1.5 [&_li]:relative [&_li]:pl-4 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-2.5 [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rounded-full [&_li]:before:bg-primary/60";

// A help-center reader, not a plain accordion: an "ask" search filters a
// left-hand question index, and the selected answer opens in a roomy reader on
// the right (inline on mobile). Answers arrive already sanitized.
export function FaqExperience({
  items,
  searchPlaceholder,
  emptyLabel,
  clearLabel,
  answerLabel,
}: {
  items: FaqItem[];
  searchPlaceholder: string;
  emptyLabel: string;
  clearLabel: string;
  answerLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.question} ${i.plain}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  const selected =
    filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="space-y-5">
      {/* Ask-style search */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.5l1.7 4.6a4 4 0 0 0 2.4 2.4l4.6 1.7-4.6 1.7a4 4 0 0 0-2.4 2.4L12 20.4l-1.7-4.6a4 4 0 0 0-2.4-2.4L3.3 11.7l4.6-1.7a4 4 0 0 0 2.4-2.4L12 2.5z" opacity=".9" />
            <path d="M5 3.5l.7 1.9.7-1.9 1.9-.7-1.9-.7L5 .2l-.7 1.9-1.9.7 1.9.7L5 3.5z" opacity=".55" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-2xl border border-line bg-white py-4 pl-12 pr-11 text-sm shadow-(--shadow-card) outline-none transition-colors focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
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
        <p className="rounded-2xl border border-line bg-white px-5 py-14 text-center text-sm text-ink-faint shadow-(--shadow-card)">
          {emptyLabel}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-start">
          {/* Left: question index (accordion on mobile) */}
          <nav className="space-y-1.5">
            {filtered.map((item, i) => {
              const active = selected?.id === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    aria-expanded={active}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                      active
                        ? "bg-[#101923] text-white shadow-sm"
                        : "text-ink-soft hover:bg-surface-sub"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-surface-sub text-ink-faint"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-bold">
                      {item.question}
                    </span>
                    <span
                      className={`shrink-0 transition-transform lg:hidden ${active ? "rotate-90" : ""}`}
                      aria-hidden="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </button>
                  {active && (
                    <div
                      className={`mt-1 rounded-2xl bg-surface-sub/50 px-4 py-4 lg:hidden ${answerClass}`}
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right: roomy reader (desktop) */}
          {selected && (
            <article className="hidden rounded-[1.5rem] border border-line/70 bg-white p-7 shadow-(--shadow-card) lg:sticky lg:top-24 lg:block lg:p-9">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                {answerLabel}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-.03em]">
                {selected.question}
              </h2>
              <div
                className={`mt-5 ${answerClass}`}
                dangerouslySetInnerHTML={{ __html: selected.answer }}
              />
            </article>
          )}
        </div>
      )}
    </div>
  );
}
