"use client";

import { useEffect, useState } from "react";
import {
  removePushSubscription,
  savePushSubscription,
} from "@/app/actions/push";

type PushState = "loading" | "unsupported" | "denied" | "on" | "off";

function applicationServerKey(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

// Opt-in card for web push. Permission is only requested on tap (never on
// load), and the subscription is stored server-side per device.
export function PushToggle({
  labels,
}: {
  labels: {
    title: string;
    body: string;
    enable: string;
    disable: string;
    denied: string;
  };
}) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window) ||
        !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ) {
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
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      const json = subscription.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
      const { ok } = await savePushSubscription({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setState(ok ? "on" : "off");
    } catch {
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-line bg-white px-4 py-3.5 shadow-(--shadow-card) sm:px-5">
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
    </section>
  );
}
