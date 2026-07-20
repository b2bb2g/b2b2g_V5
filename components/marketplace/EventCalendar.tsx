import Link from "next/link";

export type CalendarEvent = {
  id: string;
  title: string;
  href: string;
  start: string;
  end: string | null;
};

// Month-grid view of the events board. Multi-day events mark every day in
// their range; a day lists up to two entries and folds the rest into "+n".
export function EventCalendar({
  events,
  month,
  monthLabel,
  prevHref,
  nextHref,
  prevLabel,
  nextLabel,
  weekdays,
  todayIso,
}: {
  events: CalendarEvent[];
  /** YYYY-MM */
  month: string;
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  prevLabel: string;
  nextLabel: string;
  /** Length 7, Sunday first. */
  weekdays: string[];
  todayIso: string;
}) {
  const [year, monthIndex] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, monthIndex - 1, 1)).getUTCDay();

  const eventsOn = (iso: string) =>
    events.filter((event) => {
      const start = event.start.slice(0, 10);
      const end = (event.end ?? event.start).slice(0, 10);
      return start <= iso && iso <= end;
    });

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, day) => `${month}-${String(day + 1).padStart(2, "0")}`,
    ),
  ];

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-line/80 bg-white shadow-(--shadow-card)">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
        <p className="text-sm font-extrabold tracking-[-.01em]">{monthLabel}</p>
        <span className="flex gap-1">
          <Link
            href={prevHref}
            aria-label={prevLabel}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-sub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <Link
            href={nextHref}
            aria-label={nextLabel}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-sub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </span>
      </div>
      <div className="grid grid-cols-7 border-b border-line bg-surface-sub/50 text-center text-[11px] font-bold text-ink-faint">
        {weekdays.map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((iso, index) => {
          if (!iso) {
            return (
              <span
                key={`blank-${index}`}
                className="min-h-[4.25rem] border-b border-r border-line/50 bg-surface-sub/25 sm:min-h-[5.5rem]"
                aria-hidden="true"
              />
            );
          }
          const dayEvents = eventsOn(iso);
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className="min-h-[4.25rem] border-b border-r border-line/50 p-1 sm:min-h-[5.5rem] sm:p-1.5"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  isToday ? "bg-primary text-white" : "text-ink-soft"
                }`}
              >
                {Number(iso.slice(8, 10))}
              </span>
              {dayEvents.slice(0, 2).map((event) => (
                <Link
                  key={`${iso}-${event.id}`}
                  href={event.href}
                  title={event.title}
                  className="mt-0.5 block truncate rounded bg-primary-soft px-1 py-0.5 text-[10px] font-bold leading-4 text-primary-strong transition-colors hover:bg-primary hover:text-white"
                >
                  {event.title}
                </Link>
              ))}
              {dayEvents.length > 2 && (
                <span className="mt-0.5 block px-1 text-[10px] font-bold text-ink-faint">
                  +{dayEvents.length - 2}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
