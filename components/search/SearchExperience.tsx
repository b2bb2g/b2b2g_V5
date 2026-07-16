"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { OpportunityCard } from "@/components/landing/OpportunityCard";
import { EventCard } from "@/components/marketplace/EventCard";
import { BOARD_TYPES, type Locale } from "@/lib/constants";
import {
  SEARCH_MIN_QUERY_LENGTH,
  type SearchScope,
} from "@/lib/search";
import type { PostTeaser } from "@/lib/types";

type SearchLabels = {
  placeholder: string;
  popular: string;
  all: string;
  products: string;
  requests: string;
  minChars: string;
  searching: string;
  results: string;
  resultsFor: string;
  resultCount: string;
  loadMore: string;
  error: string;
  noResults: string;
  noResultsHint: string;
  clear: string;
  search: string;
  open: string;
  closed: string;
  openEnded: string;
  deadline: string;
  sourcingRequest: string;
  eventNowOn: string;
  eventUpcoming: string;
  eventEnded: string;
  eventVenueTbd: string;
};

type SearchResponse = {
  query: string;
  items: PostTeaser[];
  total: number;
  page: number;
  totalPages: number;
};

function SearchIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ResultCard({
  post,
  slug,
  locale,
  labels,
  priority,
}: {
  post: PostTeaser;
  slug: string;
  locale: Locale;
  labels: SearchLabels;
  priority: boolean;
}) {
  const href = `/${slug}/${post.id}`;

  if (post.type === BOARD_TYPES.REQUEST) {
    return (
      <OpportunityCard
        post={post}
        href={href}
        locale={locale}
        labels={{
          open: labels.open,
          closed: labels.closed,
          openEnded: labels.openEnded,
          deadline: labels.deadline,
          sourcingRequest: labels.sourcingRequest,
        }}
      />
    );
  }

  if (slug === "events") {
    return (
      <EventCard
        post={post}
        href={href}
        locale={locale}
        labels={{
          ongoing: labels.eventNowOn,
          upcoming: labels.eventUpcoming,
          ended: labels.eventEnded,
          venueTbd: labels.eventVenueTbd,
        }}
        priority={priority}
        feature
      />
    );
  }

  return (
    <ProductCard
      post={post}
      href={href}
      locale={locale}
      priority={priority}
      feature
      compactFeature
    />
  );
}

export function SearchExperience({
  initialQuery,
  initialScope,
  initialResult,
  menuSlugs,
  locale,
  labels,
}: {
  initialQuery: string;
  initialScope: SearchScope;
  initialResult: SearchResponse;
  menuSlugs: Record<string, string>;
  locale: Locale;
  labels: SearchLabels;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<SearchScope>(initialScope);
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const initialRequest = useRef(true);
  const requestSequence = useRef(0);

  const performSearch = useCallback(
    async (
      value: string,
      selectedScope: SearchScope,
      page = 1,
      append = false,
    ) => {
      const normalized = value.trim().replace(/\s+/g, " ");
      if (normalized.length < SEARCH_MIN_QUERY_LENGTH) {
        setResult({
          query: normalized,
          items: [],
          total: 0,
          page: 1,
          totalPages: 1,
        });
        setError(false);
        window.history.replaceState(null, "", "/search");
        return;
      }

      const sequence = ++requestSequence.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(false);

      try {
        const params = new URLSearchParams({
          q: normalized,
          page: String(page),
        });
        if (selectedScope !== "all") params.set("type", selectedScope);

        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("search_failed");
        const next = (await response.json()) as SearchResponse;
        if (sequence !== requestSequence.current) return;

        setResult((current) =>
          append
            ? { ...next, items: [...current.items, ...next.items] }
            : next,
        );
        const urlParams = new URLSearchParams({ q: normalized });
        if (selectedScope !== "all") urlParams.set("type", selectedScope);
        if (page > 1) urlParams.set("page", String(page));
        window.history.replaceState(
          null,
          "",
          `/search?${urlParams.toString()}`,
        );
      } catch {
        if (sequence === requestSequence.current) setError(true);
      } finally {
        if (sequence === requestSequence.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (initialRequest.current) {
      initialRequest.current = false;
      return;
    }
    const timer = window.setTimeout(
      () => void performSearch(query, scope),
      280,
    );
    return () => window.clearTimeout(timer);
  }, [performSearch, query, scope]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void performSearch(query, scope);
  }

  const hasSearch = query.trim().length >= SEARCH_MIN_QUERY_LENGTH;
  const filters: { value: SearchScope; label: string }[] = [
    { value: "all", label: labels.all },
    { value: "product", label: labels.products },
    { value: "request", label: labels.requests },
  ];
  const popularQueries =
    locale === "ko"
      ? ["태양광", "CNC", "화장품", "EPC", "발전기"]
      : ["Solar", "CNC", "Beauty", "EPC", "Generator"];

  return (
    <>
      <form
        action="/search"
        method="get"
        onSubmit={submit}
        role="search"
        className="relative"
      >
        <label htmlFor="marketplace-search" className="sr-only">
          {labels.placeholder}
        </label>
        <div className="flex items-center gap-3 rounded-[1.4rem] border border-line/80 bg-white p-2.5 shadow-[0_18px_55px_rgba(25,31,40,.09)] transition focus-within:border-primary/45 focus-within:ring-4 focus-within:ring-primary/10 sm:p-3">
          <span className="ml-2 shrink-0 text-ink-faint">
            <SearchIcon />
          </span>
          <input
            id="marketplace-search"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, 80))}
            placeholder={labels.placeholder}
            autoComplete="off"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base font-medium text-ink outline-none placeholder:text-ink-faint sm:text-lg"
          />
          {query && (
            <button
              type="button"
              aria-label={labels.clear}
              onClick={() => setQuery("")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-sub hover:text-ink"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
          <button
            type="submit"
            className="hidden min-h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-strong sm:inline-flex"
          >
            {labels.search}
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={scope === filter.value}
                onClick={() => setScope(filter.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                  scope === filter.value
                    ? "bg-[#101923] text-white shadow-sm"
                    : "border border-line bg-white text-ink-soft hover:border-primary/30 hover:text-primary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-semibold text-ink-faint">
              {labels.popular}
            </span>
            <div className="scrollbar-none flex min-w-0 gap-1 overflow-x-auto">
              {popularQueries.map((popular) => (
                <button
                  key={popular}
                  type="button"
                  onClick={() => setQuery(popular)}
                  className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/8"
                >
                  {popular}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading
          ? labels.searching
          : hasSearch
            ? `${result.total} ${labels.resultCount}`
            : labels.minChars}
      </div>

      {hasSearch && (
        <section className="mt-14 sm:mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                {labels.results}
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold leading-[1.08] tracking-[-.04em] text-ink sm:text-[2.5rem]">
                {labels.resultsFor} “{query.trim()}”
              </h2>
              {!loading && !error && (
                <p className="mt-3 text-sm text-ink-soft">
                  {result.total} {labels.resultCount}
                </p>
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-8 rounded-[1.5rem] border border-danger/20 bg-danger-soft px-6 py-10 text-center text-sm font-semibold text-danger">
              {labels.error}
            </div>
          ) : loading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[31.25rem] animate-pulse rounded-[1.5rem] bg-surface-sub"
                />
              ))}
            </div>
          ) : result.items.length === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-line bg-surface-sub/50 px-6 py-16 text-center">
              <p className="font-semibold text-ink">{labels.noResults}</p>
              <p className="mt-2 text-sm text-ink-soft">
                {labels.noResultsHint}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((post, index) => (
                  <div key={post.id} className="h-[31.25rem] min-w-0">
                    <ResultCard
                      post={post}
                      slug={menuSlugs[post.menu_id] ?? "industrial"}
                      locale={locale}
                      labels={labels}
                      priority={index < 3}
                    />
                  </div>
                ))}
              </div>
              {result.page < result.totalPages && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() =>
                      void performSearch(query, scope, result.page + 1, true)
                    }
                    className="btn-secondary btn-lg min-w-48"
                  >
                    {loadingMore ? labels.searching : labels.loadMore}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
