"use client";

import {
  removePushSubscription,
  savePushSubscription,
} from "@/app/actions/push";

// Shared browser-side web-push helpers. Permission prompts are only legal
// from a user gesture; ensureSubscribed() is the silent path used when the
// permission was already granted on this device.

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  );
}

function applicationServerKey(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function subscribeAndStore() {
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      ),
    }));
  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
  const { ok } = await savePushSubscription({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
  return ok;
}

/** Gesture path: may show the native permission dialog. */
export async function subscribeCurrentDevice(): Promise<
  "on" | "denied" | "failed"
> {
  if (!pushSupported()) return "failed";
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return permission === "denied" ? "denied" : "failed";
    }
    return (await subscribeAndStore()) ? "on" : "failed";
  } catch {
    return "failed";
  }
}

/** Silent path: keeps an already-granted device subscribed (no dialogs). */
export async function ensureSubscribed() {
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    await subscribeAndStore();
  } catch {
    // Best-effort only.
  }
}

export async function unsubscribeCurrentDevice() {
  if (!pushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await removePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
    }
  } catch {
    // Best-effort only.
  }
}
