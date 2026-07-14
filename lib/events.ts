import type { Locale } from "@/lib/constants";

// Event scheduling helpers for the flexible (Events) board. Dates are stored as
// day-only 'YYYY-MM-DD' strings; everything here works at day granularity and
// avoids timezone drift by parsing the parts directly.

export type EventStatus = "ongoing" | "upcoming" | "ended";

type Parts = { y: number; m: number; d: number };

function parse(value: string): Parts {
  const [y, m, d] = value.split("-").map(Number);
  return { y, m, d };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function asDate({ y, m, d }: Parts): Date {
  return new Date(y, m - 1, d);
}

// Live status from the schedule. A missing end falls back to the start (a
// single-day event); no dates at all means the post has no schedule to show.
export function eventStatus(
  start: string | null | undefined,
  end: string | null | undefined,
): EventStatus | null {
  if (!start && !end) return null;
  const s = start ?? end!;
  const e = end ?? start!;
  const today = todayStr();
  if (today < s) return "upcoming";
  if (today > e) return "ended";
  return "ongoing";
}

// Whole days from today until the start date (negative once it has passed).
export function daysUntil(start: string): number {
  const startMs = asDate(parse(start)).getTime();
  const t = parse(todayStr());
  const todayMs = asDate(t).getTime();
  return Math.round((startMs - todayMs) / 86_400_000);
}

// A compact "D-7 / D-DAY" countdown for upcoming and live events.
export function eventCountdown(start: string): string | null {
  const days = daysUntil(start);
  if (days < 0) return null;
  return days === 0 ? "D-DAY" : `D-${days}`;
}

// Calendar tear-off parts for the agenda's date block. `day` collapses to a
// range ("12–15") only when the event stays within one month.
export function eventDateBlock(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: Locale,
): { month: string; day: string; year: string } | null {
  if (!start && !end) return null;
  const s = parse(start ?? end!);
  const e = parse(end ?? start!);
  const month = new Intl.DateTimeFormat(locale, { month: "short" })
    .format(asDate(s))
    .toUpperCase();
  const sameMonth = s.y === e.y && s.m === e.m;
  const day =
    end && end !== (start ?? end) && sameMonth ? `${s.d}–${e.d}` : `${s.d}`;
  return { month, day, year: String(s.y) };
}

// Human date range for hero/detail/meta lines, e.g. "Mar 12 – 15, 2026".
export function formatEventRange(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: Locale,
): string | null {
  if (!start && !end) return null;
  const s = parse(start ?? end!);
  const e = parse(end ?? start!);
  const md = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const full = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const single = !end || start === end || (s.y === e.y && s.m === e.m && s.d === e.d);
  if (single) return full.format(asDate(s));
  if (s.y === e.y) {
    // Same year: don't repeat it on the start side.
    return `${md.format(asDate(s))} – ${full.format(asDate(e))}`;
  }
  return `${full.format(asDate(s))} – ${full.format(asDate(e))}`;
}
