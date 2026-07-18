"use client";

import { useEffect, useState } from "react";
import { savePushPreferences } from "@/app/actions/push";
import {
  pushSupported,
  subscribeCurrentDevice,
  unsubscribeCurrentDevice,
} from "@/lib/push-client";

type PushState = "loading" | "unsupported" | "denied" | "on" | "off";

const CATEGORY_KEYS = [
  "posts",
  "messages",
  "badges",
  "social",
  "membership",
] as const;

// Opt-in card for web push with per-category muting. Permission is only
// requested on tap (never on load); the auto-offer banner handles proactive
// prompting on mobile.
export function PushToggle({
  initialMuted,
  labels,
}: {
  initialMuted: string[];
  labels: {
    title: string;
    body: string;
    enable: string;
    disable: string;
    denied: string;
    categories: string;
    categoryLabels: Record<(typeof CATEGORY_KEYS)[number], string>;
  };
}) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState<string[]>(initialMuted);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!pushSupported()) {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setState(subscription ? "on" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  async function enable() {
    setBusy(true);
    const result = await subscribeCurrentDevice();
    setState(result === "on" ? "on" : result === "denied" ? "denied" : "off");
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    await unsubscribeCurrentDevice();
    setState("off");
    setBusy(false);
  }

  async function toggleCategory(key: string) {
    const next = muted.includes(key)
      ? muted.filter((item) => item !== key)
      : [...muted, key];
    setMuted(next);
    await savePushPreferences(next);
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <section className="rounded-[1.35rem] border border-line bg-white px-4 py-3.5 shadow-(--shadow-card) sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${state === "on" ? "bg-primary-soft text-primary" : "bg-surface-sub text-ink-faint"}`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">{labels.title}</p>
            <p className="mt-0.5 text-xs leading-5 text-ink-faint">
              {state === "denied" ? labels.denied : labels.body}
            </p>
          </div>
        </div>
        {state !== "denied" && (
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={state === "on" ? disable : enable}
            className={
              state === "on"
                ? "btn-secondary btn-sm shrink-0 disabled:opacity-60"
                : "btn-primary btn-sm shrink-0 disabled:opacity-60"
            }
          >
            {busy ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" aria-hidden="true" />
            ) : state === "on" ? (
              labels.disable
            ) : (
              labels.enable
            )}
          </button>
        )}
      </div>

      {state === "on" && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-ink-faint">
            {labels.categories}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {CATEGORY_KEYS.map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink-soft"
              >
                <input
                  type="checkbox"
                  checked={!muted.includes(key)}
                  onChange={() => toggleCategory(key)}
                  className="h-4 w-4 rounded accent-primary"
                />
                {labels.categoryLabels[key]}
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
