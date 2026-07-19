"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";

// Stores the caller's own web-push subscription (RLS: self rows only).
export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const endpoint = String(subscription?.endpoint ?? "");
  const p256dh = String(subscription?.keys?.p256dh ?? "");
  const auth = String(subscription?.keys?.auth ?? "");
  if (!endpoint.startsWith("https://") || !p256dh || !auth) {
    return { ok: false };
  }

  const userAgent = (await headers()).get("user-agent")?.slice(0, 250) ?? null;
  const locale = await getLocale();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
      locale,
    },
    { onConflict: "endpoint" },
  );
  // Pre-migration rows have no locale column; keep the subscription alive.
  if (error?.message?.includes("locale")) {
    const { error: retryError } = await supabase
      .from("push_subscriptions")
      .upsert(
        { profile_id: user.id, endpoint, p256dh, auth, user_agent: userAgent },
        { onConflict: "endpoint" },
      );
    return { ok: !retryError };
  }
  return { ok: !error };
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", String(endpoint ?? ""));
  return { ok: !error };
}

const PUSH_CATEGORIES = ["posts", "messages", "badges", "social", "membership"];

// Muted categories skip the web push; in-app notifications are unaffected.
export async function savePushPreferences(muted: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const cleaned = Array.isArray(muted)
    ? muted.filter((item) => PUSH_CATEGORIES.includes(String(item)))
    : [];
  const { error } = await supabase
    .from("profiles")
    .update({ push_muted_types: cleaned })
    .eq("id", user.id);
  return { ok: !error };
}
