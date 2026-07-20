"use client";

/* eslint-disable react-hooks/set-state-in-effect --
   In-app browser detection needs the runtime user agent; a one-shot state
   sync after mount avoids SSR hydration mismatches. */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// PRD 13: in-app browsers (KakaoTalk, Instagram, Line, Facebook) break sign-in,
// file uploads and external links. On the admin-configured paths the escape is
// forced (those actions cannot work in-app); everywhere else — including the
// landing a shared link opens to — it shows as a dismissible nudge so recipients
// know to reopen in their real browser. KakaoTalk on Android can jump out via a
// scheme; other in-app browsers get guidance. Controlled by inapp_redirect_enabled.
export function InAppGuard({
  enabled,
  paths,
  title,
  body,
  openLabel,
  dismissLabel,
}: {
  enabled: boolean;
  // Path prefixes where the escape is forced (non-dismissible), e.g. auth.
  paths: string[];
  title: string;
  body: string;
  openLabel: string;
  dismissLabel: string;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<{ show: boolean; kakaoAndroid: boolean }>({
    show: false,
    kakaoAndroid: false,
  });
  const [dismissed, setDismissed] = useState(false);

  const forced = paths.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (!enabled) return;
    const ua = navigator.userAgent;
    const inApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(ua);
    if (!inApp) return;
    setState({
      show: true,
      kakaoAndroid: /KAKAOTALK/i.test(ua) && /Android/i.test(ua),
    });
    try {
      if (sessionStorage.getItem("b2bb2g:inapp-dismissed") === "1") {
        setDismissed(true);
      }
    } catch {
      // Session storage is best-effort only.
    }
  }, [enabled]);

  if (!state.show) return null;
  // Forced pages (auth/uploads) always show; the general nudge can be dismissed.
  if (dismissed && !forced) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3">
      <div className="mx-auto max-w-3xl rounded-card border border-line bg-surface p-4 shadow-(--shadow-float)">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              {body}
            </p>
          </div>
          {!forced && (
            <button
              type="button"
              aria-label={dismissLabel}
              onClick={() => {
                setDismissed(true);
                try {
                  sessionStorage.setItem("b2bb2g:inapp-dismissed", "1");
                } catch {
                  // Best-effort only.
                }
              }}
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface-sub hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
        {state.kakaoAndroid && (
          <button
            type="button"
            onClick={() => {
              window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(
                window.location.href,
              )}`;
            }}
            className="btn-primary btn-md mt-3 w-full"
          >
            {openLabel}
          </button>
        )}
      </div>
    </div>
  );
}
