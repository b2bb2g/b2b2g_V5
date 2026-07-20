"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// First-steps checklist for new members: real completion state from the
// server, dismissal kept on the device. Disappears on its own once every
// step is done.
const DISMISS_KEY = "b2bb2g:onboarding-dismissed";

export type OnboardingStep = {
  key: string;
  label: string;
  href: string;
  done: boolean;
};

export function OnboardingChecklist({
  steps,
  labels,
}: {
  steps: OnboardingStep[];
  labels: { title: string; hint: string; dismiss: string; progress: string };
}) {
  const [visible, setVisible] = useState(false);
  const doneCount = steps.filter((step) => step.done).length;
  const allDone = doneCount === steps.length;

  useEffect(() => {
    if (allDone) return;
    const timer = setTimeout(() => {
      try {
        setVisible(!window.localStorage.getItem(DISMISS_KEY));
      } catch {
        setVisible(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [allDone]);

  if (!visible || allDone) return null;

  return (
    <section className="rounded-[1.5rem] border border-primary/25 bg-primary-soft/40 p-5 shadow-(--shadow-card) sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-[-.01em]">
            {labels.title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-soft">{labels.hint}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              // Device storage is best-effort only.
            }
            setVisible(false);
          }}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-ink-faint transition-colors hover:text-ink"
        >
          {labels.dismiss}
        </button>
      </div>

      <p className="mt-3 text-xs font-bold text-primary-strong">
        {labels.progress.replace("{done}", String(doneCount)).replace("{total}", String(steps.length))}
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.key}>
            {step.done ? (
              <span className="flex min-h-11 items-center gap-2.5 rounded-xl bg-white/70 px-3 text-sm font-semibold text-ink-faint line-through">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive text-white" aria-hidden="true">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {step.label}
              </span>
            ) : (
              <Link
                href={step.href}
                className="flex min-h-11 items-center gap-2.5 rounded-xl bg-white px-3 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:text-primary"
              >
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-line" aria-hidden="true" />
                {step.label}
                <span className="ml-auto text-ink-faint" aria-hidden="true">→</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
