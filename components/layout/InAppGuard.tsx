"use client";

/* eslint-disable react-hooks/set-state-in-effect --
   In-app browser detection needs the runtime user agent; a one-shot state
   sync after mount avoids SSR hydration mismatches. */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// PRD 13: core actions (auth, uploads) are pushed out of in-app browsers.
// KakaoTalk on Android supports a scheme that opens the default browser;
// elsewhere we show guidance. Controlled by the inapp_redirect_enabled switch.
export function InAppGuard({
  enabled,
  paths,
  title,
  body,
  openLabel,
}: {
  enabled: boolean;
  // Admin-configured path prefixes that trigger the escape (PRD 17.11).
  paths: string[];
  title: string;
  body: string;
  openLabel: string;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<{ show: boolean; kakaoAndroid: boolean }>({
    show: false,
    kakaoAndroid: false,
  });

  const matches = paths.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (!enabled) return;
    const ua = navigator.userAgent;
    const inApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(ua);
    if (!inApp) return;
    setState({
      show: true,
      kakaoAndroid: /KAKAOTALK/i.test(ua) && /Android/i.test(ua),
    });
  }, [enabled]);

  if (!state.show || !matches) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3">
      <div className="mx-auto max-w-3xl rounded-card border border-line bg-surface p-4 shadow-(--shadow-float)">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{body}</p>
        {state.kakaoAndroid && (
          <button
            type="button"
            onClick={() => {
              window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(
                window.location.href
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
