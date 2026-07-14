import type { ReactNode } from "react";

// The single page header for every member-area surface (dashboard sub-pages,
// inquiries, notifications). It carries the page's h1, so each page has exactly
// one — the workspace hero on /dashboard is the only other h1 in the area.
export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const detail = description ?? subtitle;
  return (
    <header className="flex flex-col gap-4 rounded-[1.5rem] border border-line/70 bg-white px-5 py-5 shadow-(--shadow-card) sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[.15em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className={`type-workspace-title ${eyebrow ? "mt-1.5" : ""}`}>
          {title}
        </h1>
        {detail && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">
            {detail}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
      )}
    </header>
  );
}
