"use client";

/* eslint-disable react-hooks/set-state-in-effect --
   Banner visibility depends on localStorage/matchMedia, which only exist in
   the browser; a one-shot state sync after mount is the standard pattern to
   avoid SSR hydration mismatches. */

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import { COOKIE_CONSENT_KEY } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n";
import {
  ensureSubscribed,
  pushSupported,
  subscribeCurrentDevice,
} from "@/lib/push-client";

// Cookie consent + PWA install banners (PRD 18.1/18.4).
// Priority rule: the cookie banner always goes first; the install banner
// appears only after consent has been handled. Bottom banners only, no
// full-screen interrupts.
const CONSENT_KEY = COOKIE_CONSENT_KEY;
const PWA_DISMISS_KEY = "pwa-banner-dismissed-at";
const PUSH_DISMISS_KEY = "push-banner-dismissed-at";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function GlobalBanners({
  cookie,
  pwa,
  push,
  pwaEnabled,
  redisplayDays,
  cookieMessage,
  signedIn = false,
}: {
  cookie: Dictionary["cookie"];
  pwa: Dictionary["pwa"];
  push: { title: string; body: string; enable: string; later: string };
  pwaEnabled: boolean;
  redisplayDays: number;
  cookieMessage?: string;
  signedIn?: boolean;
}) {
  const [consentDone, setConsentDone] = useState(true);
  const [pwaDismissed, setPwaDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [pushOffer, setPushOffer] = useState(false);

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

    // Push: silently refresh an already-granted device, and offer the rest.
    if (signedIn && pushSupported()) {
      if (Notification.permission === "granted") {
        void ensureSubscribed();
      } else if (Notification.permission === "default") {
        const pushDismissedAt = Number(
          localStorage.getItem(PUSH_DISMISS_KEY) ?? 0,
        );
        setPushOffer(
          !(
            pushDismissedAt > 0 &&
            Date.now() - pushDismissedAt < redisplayDays * 86400_000
          ),
        );
      }
    }
    // A fresh install is the strongest signal of app intent: re-offer push.
    const installed = () => {
      localStorage.removeItem(PUSH_DISMISS_KEY);
      if (
        signedIn &&
        pushSupported() &&
        Notification.permission === "default"
      ) {
        setPushOffer(true);
      }
    };
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, [redisplayDays, signedIn]);

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
  const showPush = !isInApp && consentDone && !showPwa && pushOffer;

  function dismissPush() {
    localStorage.setItem(PUSH_DISMISS_KEY, String(Date.now()));
    setPushOffer(false);
  }

  async function enablePush() {
    setPushOffer(false);
    const result = await subscribeCurrentDevice();
    if (result !== "on") localStorage.setItem(PUSH_DISMISS_KEY, String(Date.now()));
  }

  useLayoutEffect(() => {
    const visible = showCookie || showPwa || showPush;
    document.body.classList.add("global-banner-ready");
    document.body.classList.toggle("has-global-banner", visible);
    return () => {
      document.body.classList.remove("global-banner-ready");
      document.body.classList.remove("has-global-banner");
    };
  }, [showCookie, showPwa, showPush]);

  if (isInApp) return null;

  if (showCookie) {
    return (
      <div
        className="global-banner cookie-consent-banner pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5"
        role="region"
        aria-live="polite"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <div className="pointer-events-auto mx-auto w-full max-w-[720px] rounded-[24px] border border-line bg-surface p-5 shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_264px] sm:items-end">
            <div className="min-w-0">
              <p
                id="cookie-banner-title"
                className="flex items-center gap-2 text-sm font-bold text-ink"
              >
                <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
                {cookie.preferencesTitle}
              </p>
              <p
                id="cookie-banner-description"
                className="mt-2 text-sm leading-6 text-ink-soft"
              >
                {cookieMessage || cookie.message}
              </p>
              <Link
                href="/legal/cookies"
                className="mt-2 inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-primary transition-colors hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {cookie.policyLink}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => saveConsent(false)}
                className="h-11 whitespace-nowrap rounded-full bg-surface-sub px-4 text-sm font-semibold text-ink-soft transition-colors hover:bg-primary-soft hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {cookie.essentialOnly}
              </button>
              <button
                type="button"
                onClick={() => saveConsent(true)}
                className="h-11 whitespace-nowrap rounded-full bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {cookie.acceptAll}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPush) {
    return (
      <div
        className="global-banner fixed inset-x-0 bottom-0 z-50 p-3"
        role="region"
        aria-live="polite"
      >
        <div className="mx-auto max-w-3xl rounded-card border border-line bg-surface p-4 shadow-lg">
          <p className="text-sm font-bold">{push.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            {push.body}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={dismissPush}
              className="flex-1 rounded-xl bg-surface-sub px-3 py-2.5 text-xs font-semibold text-ink-soft"
            >
              {push.later}
            </button>
            <button
              type="button"
              onClick={enablePush}
              className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white"
            >
              {push.enable}
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
