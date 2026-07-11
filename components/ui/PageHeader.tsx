import type { ReactNode } from "react";

// Standard sub-page header: one typographic voice across every screen.
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] border border-line/80 bg-white px-5 py-6 shadow-[0_12px_40px_rgba(25,31,40,.05)] sm:px-7 sm:py-8">
      <span
        className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-primary/8 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <span
            className="mb-3 block h-1 w-9 rounded-full bg-primary"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-extrabold tracking-[-.035em] sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-6 text-ink-soft">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
