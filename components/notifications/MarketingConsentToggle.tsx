"use client";

import { useState } from "react";
import { saveMarketingConsent } from "@/app/actions/push";
import { Switch } from "@/components/ui/Switch";

// Post-signup opt-in / opt-out for marketing messages. The choice is stored on
// the member's profile (marketing_consent); admins can see it.
export function MarketingConsentToggle({
  initialConsent,
  labels,
}: {
  initialConsent: boolean;
  labels: { title: string; body: string; on: string; off: string };
}) {
  const [on, setOn] = useState(initialConsent);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next);
    setBusy(true);
    const result = await saveMarketingConsent(next);
    if (!result?.ok) setOn(!next); // revert if the update failed
    setBusy(false);
  }

  return (
    <section className="rounded-[1.35rem] border border-line bg-white px-4 py-3.5 shadow-(--shadow-card) sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? "bg-primary-soft text-primary" : "bg-surface-sub text-ink-faint"}`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 11 18-5v12L3 14v-3z" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">{labels.title}</p>
            <p className="mt-0.5 text-xs leading-5 text-ink-faint">{labels.body}</p>
          </div>
        </div>
        <Switch
          checked={on}
          disabled={busy}
          onClick={toggle}
          label={`${labels.title}: ${on ? labels.on : labels.off}`}
        />
      </div>
    </section>
  );
}
