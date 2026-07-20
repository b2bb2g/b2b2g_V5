"use client";

import { useMemo, useState } from "react";

export type FaqGuideItem = { q: string; a: string[] };
export type FaqGuideCategory = {
  id: string;
  title: string;
  items: FaqGuideItem[];
};

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

// Renders an answer: consecutive "1) ..." lines become a numbered step list
// (with the marker stripped), everything else stays a paragraph. This keeps the
// how-to click-paths readable as real steps.
function AnswerBody({ lines }: { lines: string[] }) {
  const blocks: Array<
    { type: "p"; text: string } | { type: "steps"; items: string[] }
  > = [];
  for (const line of lines) {
    const match = line.match(/^\s*\d+\)\s*(.*)$/);
    if (match) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "steps") last.items.push(match[1]);
      else blocks.push({ type: "steps", items: [match[1]] });
    } else {
      blocks.push({ type: "p", text: line });
    }
  }
  return (
    <div className="space-y-3 border-t border-line/70 bg-[#fbfbfd] px-5 py-4 text-[14.5px] leading-7 text-ink-soft">
      {blocks.map((block, index) =>
        block.type === "steps" ? (
          <ol key={index} className="space-y-2">
            {block.items.map((step, stepIndex) => (
              <li key={stepIndex} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-extrabold text-primary">
                  {stepIndex + 1}
                </span>
                <span className="min-w-0">{step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p key={index}>{block.text}</p>
        ),
      )}
    </div>
  );
}

// Manual-style help center: questions grouped into categories with a jump nav,
// a search that narrows across every category, and native disclosure rows so
// it stays accessible and keyboard-friendly.
export function FaqGuide({
  categories,
  labels,
}: {
  categories: FaqGuideCategory[];
  labels: {
    search: string;
    clear: string;
    empty: string;
    count: string;
    onThisPage: string;
  };
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter((it) =>
          `${it.q} ${it.a.join(" ")}`.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, q]);

  const total = filtered.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="space-y-8">
      <div className="rounded-[1.5rem] border border-line/70 bg-[#f5f5f7] p-3 sm:p-4">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-primary">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search}
            aria-label={labels.search}
            className="min-h-14 w-full rounded-2xl border border-white bg-white py-3.5 pl-12 pr-12 text-base shadow-[0_4px_18px_rgba(25,31,40,.06)] outline-none transition focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={labels.clear}
              className="absolute inset-y-0 right-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-sub hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="px-2 pb-1 pt-3 text-right text-xs font-bold text-ink-faint" role="status" aria-live="polite">
          {total} {labels.count}
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-[1.5rem] border border-line bg-white px-6 py-16 text-center shadow-(--shadow-card)">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <SearchIcon />
          </span>
          <p className="mt-4 text-base font-bold text-ink">{labels.empty}</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 min-h-11 rounded-full bg-surface-sub px-5 text-sm font-bold text-ink-soft transition hover:bg-line"
          >
            {labels.clear}
          </button>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-10">
          <nav
            aria-label={labels.onThisPage}
            className="hidden lg:sticky lg:top-24 lg:block"
          >
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[.14em] text-ink-faint">
              {labels.onThisPage}
            </p>
            <ul className="space-y-0.5">
              {filtered.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#faq-${c.id}`}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sub hover:text-ink"
                  >
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-10">
            {!q && (
              <div className="flex flex-wrap gap-2 lg:hidden">
                {filtered.map((c) => (
                  <a
                    key={c.id}
                    href={`#faq-${c.id}`}
                    className="rounded-full border border-line bg-white px-3.5 py-2 text-xs font-bold text-ink-soft transition-colors hover:border-primary hover:text-primary"
                  >
                    {c.title}
                  </a>
                ))}
              </div>
            )}

            {filtered.map((c) => (
              <section key={c.id} id={`faq-${c.id}`} className="scroll-mt-24">
                <h2 className="text-lg font-extrabold tracking-[-.02em] text-ink">
                  {c.title}
                </h2>
                <div className="mt-4 space-y-2.5">
                  {c.items.map((item, index) => (
                    <details
                      key={`${c.id}-${index}`}
                      className="group overflow-hidden rounded-2xl border border-line/80 bg-white shadow-[0_7px_24px_rgba(25,31,40,.045)] open:border-primary/25"
                    >
                      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-left [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 flex-1 text-[15px] font-bold leading-6 text-ink">
                          {item.q}
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sub text-ink-faint transition-transform group-open:rotate-45">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      </summary>
                      <AnswerBody lines={item.a} />
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
