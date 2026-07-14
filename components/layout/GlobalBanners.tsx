"use client";

/* eslint-disable react-hooks/set-state-in-effect --
   Banner visibility depends on localStorage/matchMedia, which only exist in
   the browser; a one-shot state sync after mount is the standard pattern to
   avoid SSR hydration mismatches. */

import { useEffect, useLayoutEffect, useState } from "react";
import { COOKIE_CONSENT_KEY } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n";

// Cookie consent + PWA install banners (PRD 18.1/18.4).
// Priority rule: the cookie banner always goes first; the install banner
// appears only after consent has been handled. Bottom banners only, no
// full-screen interrupts.
const CONSENT_KEY = COOKIE_CONSENT_KEY;
const PWA_DISMISS_KEY = "pwa-banner-dismissed-at";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function GlobalBanners({
  cookie,
  pwa,
  pwaEnabled,
  redisplayDays,
  cookieMessage,
}: {
  cookie: Dictionary["cookie"];
  pwa: Dictionary["pwa"];
  pwaEnabled: boolean;
  redisplayDays: number;
  cookieMessage?: string;
}) {
  const [consentDone, setConsentDone] = useState(true);
  const [pwaDismissed, setPwaDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    setConsentDone(!!localStorage.getItem(CONSENT_KEY));

    const dismissedAt = Number(localStorage.getItem(PWA_DISMISS_KEY) ?? 0);
    setPwaDismissed(
      dismissedAt > 0 && Date.now() - dismissedAt < redisplayDays * 86400_000,
    );

    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          (navigator as { standalone?: boolean }).standalone === true),
    );
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setIsInApp(
      /KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent),
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [redisplayDays]);

  function saveConsent(all: boolean) {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        essential: true,
        analytics: all,
        at: new Date().toISOString(),
      }),
    );
    setConsentDone(true);
  }

  function dismissPwa() {
    localStorage.setItem(PWA_DISMISS_KEY, String(Date.now()));
    setPwaDismissed(true);
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    dismissPwa();
  }

  const showCookie = !isInApp && !consentDone;
  const showPwa =
    !isInApp &&
    consentDone &&
    pwaEnabled &&
    !pwaDismissed &&
    !isStandalone &&
    (isIos || !!installPrompt);

  useLayoutEffect(() => {
    const visible = showCookie || showPwa;
    document.body.classList.add("global-banner-ready");
    document.body.classList.toggle("has-global-banner", visible);
    return () => {
      document.body.classList.remove("global-banner-ready");
      document.body.classList.remove("has-global-banner");
    };
  }, [showCookie, showPwa]);

  if (isInApp) return null;

  if (showCookie) {
    return (
      <div
        className="global-banner fixed inset-x-0 bottom-0 z-50 p-2 sm:p-3"
        role="region"
        aria-live="polite"
      >
        <div className="mx-auto max-w-3xl rounded-card border border-line bg-surface p-2.5 shadow-lg sm:flex sm:items-center sm:gap-4 sm:px-4 sm:py-3">
          <p className="line-clamp-2 flex-1 text-xs leading-5 text-ink-soft">
            {cookieMessage || cookie.message}
          </p>
          <div className="mt-2 flex shrink-0 gap-2 sm:mt-0">
            <button
              type="button"
              onClick={() => saveConsent(false)}
              className="flex-1 rounded-xl bg-surface-sub px-3 py-1.5 text-xs font-semibold text-ink-soft sm:px-4 sm:py-2"
            >
              {cookie.essentialOnly}
            </button>
            <button
              type="button"
              onClick={() => saveConsent(true)}
              className="flex-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white sm:px-4 sm:py-2"
            >
              {cookie.acceptAll}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showPwa) return null;

  return (
    <div
      className="global-banner fixed inset-x-0 bottom-0 z-50 p-3"
      role="region"
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl rounded-card border border-line bg-surface p-4 shadow-lg">
        <p className="text-sm font-bold">{pwa.installTitle}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
          {isIos ? pwa.iosHint : pwa.installBody}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={dismissPwa}
            className="flex-1 rounded-xl bg-surface-sub px-3 py-2.5 text-xs font-semibold text-ink-soft"
          >
            {pwa.dismiss}
          </button>
          {!isIos && (
            <button
              type="button"
              onClick={install}
              className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white"
            >
              {pwa.install}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
