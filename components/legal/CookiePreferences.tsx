"use client";

/* eslint-disable react-hooks/set-state-in-effect -- consent lives in
   localStorage; state must sync from it after mount. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_CONSENT_KEY } from "@/lib/constants";
import { Switch } from "@/components/ui/Switch";

// Consent can be changed any time from the cookie policy page (PRD 18.4).
export function CookiePreferences({
  labels,
}: {
  labels: { title: string; essential: string; analytics: string; save: string };
}) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (raw) setAnalytics(!!JSON.parse(raw).analytics);
    } catch {
      // Corrupt value: treat as essential-only.
    }
  }, []);

  return (
    <section className="rounded-card border border-line p-4">
      <h2 className="text-sm font-bold">{labels.title}</h2>
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3 text-sm text-ink-soft">
          <span>{labels.essential}</span>
          <Switch checked disabled label={labels.essential} />
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-ink-soft">
          <span>{labels.analytics}</span>
          <Switch
            checked={analytics}
            onClick={() => setAnalytics((value) => !value)}
            label={labels.analytics}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(
            COOKIE_CONSENT_KEY,
            JSON.stringify({
              essential: true,
              analytics,
              at: new Date().toISOString(),
            })
          );
          router.replace("/legal/cookies?toast=saved");
        }}
        className="btn-primary btn-md mt-4"
      >
        {labels.save}
      </button>
    </section>
  );
}
