import type { ReactNode } from "react";

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
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.35rem] border border-line bg-white px-5 py-4 shadow-[0_8px_28px_rgba(25,31,40,.045)] sm:px-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[.15em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2
          className={`${eyebrow ? "mt-1" : ""} text-2xl font-extrabold tracking-[-.035em]`}
        >
          {title}
        </h2>
        {(description || subtitle) && (
          <p className="mt-1 text-xs leading-5 text-ink-faint">
            {description || subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
