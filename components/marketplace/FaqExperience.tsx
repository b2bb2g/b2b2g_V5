"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type FaqItem = {
  id: string;
  question: string;
  answer: string; // pre-sanitized HTML
  plain: string; // stripped text, for search
};

const answerClass =
  "text-[15px] leading-7 text-ink-soft [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_p+p]:mt-3.5 [&_strong]:font-bold [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:space-y-1.5 [&_li]:relative [&_li]:pl-4 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-2.5 [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rounded-full [&_li]:before:bg-primary/60";

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// A task-oriented help center: search narrows the question set, mobile uses
// native disclosure controls, and desktop keeps the question index beside a
// stable answer reader. Answers arrive already sanitized by the server.
export function FaqExperience({
  items,
  searchPlaceholder,
  emptyLabel,
  clearLabel,
  answerLabel,
  questionsLabel,
  questionCountLabel,
  helpTitle,
  helpBody,
  helpActionLabel,
  helpHref,
}: {
  items: FaqItem[];
  searchPlaceholder: string;
  emptyLabel: string;
  clearLabel: string;
  answerLabel: string;
  questionsLabel: string;
  questionCountLabel: string;
  helpTitle: string;
  helpBody: string;
  helpActionLabel: string;
  helpHref: string;
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
  const selectedIndex = selected
    ? filtered.findIndex((item) => item.id === selected.id)
    : -1;

  return (
    <div className="space-y-6" data-faq-experience>
      <div className="rounded-[1.75rem] border border-line/70 bg-[#f5f5f7] p-3 shadow-[0_16px_50px_rgba(25,31,40,.05)] sm:p-4">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-primary">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="min-h-14 w-full rounded-2xl border border-white bg-white py-3.5 pl-12 pr-12 text-base shadow-[0_4px_18px_rgba(25,31,40,.06)] outline-none transition focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={clearLabel}
              className="absolute inset-y-0 right-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-sub hover:text-ink"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div
          className="flex items-center justify-between gap-4 px-2 pb-1 pt-3 text-xs font-bold text-ink-faint"
          role="status"
          aria-live="polite"
        >
          <span>{questionsLabel}</span>
          <span>
            {filtered.length} {questionCountLabel}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[1.75rem] border border-line bg-white px-6 py-16 text-center shadow-(--shadow-card)">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <SearchIcon />
          </span>
          <p className="mt-4 text-base font-bold text-ink">{emptyLabel}</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 min-h-11 rounded-full bg-surface-sub px-5 text-sm font-bold text-ink-soft transition hover:bg-line"
          >
            {clearLabel}
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 lg:hidden" data-faq-mobile>
            {filtered.map((item, index) => (
              <details
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-line/80 bg-white shadow-[0_7px_24px_rgba(25,31,40,.045)] open:border-primary/25"
                open={index === 0 && query.length === 0}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 text-left [&::-webkit-details-marker]:hidden">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-xs font-extrabold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-bold leading-6 text-ink">
                    {item.question}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sub text-ink-faint transition-transform group-open:rotate-45">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <div
                  className={`border-t border-line/70 bg-[#fbfbfd] px-5 py-5 ${answerClass}`}
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </details>
            ))}
          </div>

          <div className="hidden gap-6 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
            <aside className="rounded-[1.75rem] border border-line/70 bg-[#f5f5f7] p-3">
              <div className="flex items-center justify-between gap-4 px-3 pb-3 pt-2">
                <p className="text-sm font-extrabold text-ink">
                  {questionsLabel}
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink-faint">
                  {filtered.length}
                </span>
              </div>
              <nav className="space-y-1.5" data-faq-index aria-label={questionsLabel}>
                {filtered.map((item, index) => {
                  const active = selected?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      aria-expanded={active}
                      aria-controls="faq-answer-reader"
                      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                        active
                          ? "border-primary/20 bg-white text-ink shadow-[0_8px_24px_rgba(25,31,40,.07)]"
                          : "border-transparent text-ink-soft hover:border-line hover:bg-white/70 hover:text-ink"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
                          active
                            ? "bg-primary text-white"
                            : "bg-white text-ink-faint"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-bold leading-5">
                        {item.question}
                      </span>
                      <span
                        className={`shrink-0 ${active ? "text-primary" : "text-ink-faint"}`}
                      >
                        <Arrow />
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {selected && (
              <article
                id="faq-answer-reader"
                className="min-h-[30rem] rounded-[2rem] border border-line/70 bg-white p-8 shadow-[0_18px_55px_rgba(25,31,40,.07)] lg:sticky lg:top-24 xl:p-10"
              >
                <div className="flex items-center justify-between gap-5">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                    {answerLabel}
                  </p>
                  <span className="text-xs font-bold text-ink-faint">
                    {String(selectedIndex + 1).padStart(2, "0")} /{" "}
                    {String(filtered.length).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-.035em] text-ink xl:text-4xl">
                  {selected.question}
                </h2>
                <div
                  className={`mt-7 max-w-3xl ${answerClass}`}
                  dangerouslySetInnerHTML={{ __html: selected.answer }}
                />
              </article>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-5 rounded-[1.75rem] bg-[#101923] p-6 text-white shadow-[0_18px_55px_rgba(16,25,35,.16)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold tracking-[-.025em]">
            {helpTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/68">{helpBody}</p>
        </div>
        <Link
          href={helpHref}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#101923] transition hover:bg-white/88"
        >
          {helpActionLabel}
          <Arrow />
        </Link>
      </div>
    </div>
  );
}
