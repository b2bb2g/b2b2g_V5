import type { ReactNode } from "react";

export function BoardSectionHeading({
  eyebrow,
  title,
  body,
  action,
  level = "h2",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: ReactNode;
  level?: "h1" | "h2";
}) {
  const Heading = level;

  return (
    <div className="flex items-end justify-between gap-6">
      <div className="min-w-0 max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
          {eyebrow}
        </p>
        <Heading className="mt-3 text-[2rem] font-semibold leading-[1.08] tracking-[-.035em] text-ink sm:text-[2.5rem] lg:text-5xl">
          {title}
        </Heading>
        {body && (
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
            {body}
          </p>
        )}
      </div>
      {action && <div className="hidden shrink-0 sm:block">{action}</div>}
    </div>
  );
}
