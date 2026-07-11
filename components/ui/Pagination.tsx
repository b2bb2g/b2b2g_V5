import Link from "next/link";

// Link-based pagination (server-rendered, query-param driven).
export function Pagination({
  page,
  totalPages,
  basePath,
  extraQuery = {},
  prevLabel,
  nextLabel,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  extraQuery?: Record<string, string>;
  prevLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(extraQuery);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Compact window: first, current +-1, last.
  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );
  const items: (number | "gap")[] = [];
  for (const n of numbers) {
    const prev = items[items.length - 1];
    if (typeof prev === "number" && n - prev > 1) items.push("gap");
    items.push(n);
  }

  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors";

  return (
    <nav className="flex items-center justify-center gap-1 pt-4">
      {page > 1 && (
        <Link href={href(page - 1)} aria-label={prevLabel} className={`${btn} bg-surface-sub text-ink-soft hover:bg-line/70`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
      )}
      {items.map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-faint">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${btn} ${
              item === page
                ? "bg-ink text-white"
                : "bg-surface-sub text-ink-soft hover:bg-line/70"
            }`}
          >
            {item}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} aria-label={nextLabel} className={`${btn} bg-surface-sub text-ink-soft hover:bg-line/70`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </Link>
      )}
    </nav>
  );
}
