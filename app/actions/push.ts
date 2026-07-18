"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
    },
    { onConflict: "endpoint" },
  );
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
