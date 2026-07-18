import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

// Called by the notifications insert trigger (pg_net) with just a row id.
// Authentication model: the ping carries no content — this route re-reads the
// notification with the service role and only ever pushes a member's own
// notification to that member's own registered devices, so a forged ping
// cannot leak or spray anything. Recency-gated to keep replays pointless.
const MAX_AGE_MS = 10 * 60 * 1000;

const PUSH_TEXT: Record<string, string> = {
  post_approved: "Your post was published",
  post_rejected: "Your post was returned after review",
  message_delivered: "A new message arrived in your inbox",
  message_rejected: "Your message was returned after review",
  badge_approved: "Your badge application was approved",
  badge_rejected: "Your badge application was returned",
  subscription_expiring: "Your membership is expiring soon",
  feed_liked: "Someone liked your post",
  feed_commented: "New comment on your post",
  admin_notice: "Notice from the operations team",
};

function pushUrl(type: string, payload: Record<string, unknown>): string {
  if (typeof payload.feed_post_id === "string")
    return `/feed/${payload.feed_post_id}`;
  if (typeof payload.inquiry_id === "string")
    return `/inquiries/${payload.inquiry_id}`;
  if (typeof payload.post_id === "string") return "/dashboard/posts";
  if (type.startsWith("badge_")) return "/dashboard/badges";
  if (type === "subscription_expiring") return "/membership";
  return "/notifications";
}

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!serviceKey || !vapidPublic || !vapidPrivate) {
    return NextResponse.json({ ok: false, reason: "not_configured" });
  }

  let id = "";
  try {
    const body = (await request.json()) as { id?: string };
    id = String(body.id ?? "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: notification } = await supabase
    .from("notifications")
    .select("id, profile_id, type, payload, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!notification) return NextResponse.json({ ok: false });
  if (Date.now() - new Date(notification.created_at).getTime() > MAX_AGE_MS) {
    return NextResponse.json({ ok: false, reason: "stale" });
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("profile_id", notification.profile_id);
  if (!subscriptions?.length) return NextResponse.json({ ok: true, sent: 0 });

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:no-reply@b2bb2g.com",
    vapidPublic,
    vapidPrivate,
  );

  const payload = (notification.payload ?? {}) as Record<string, unknown>;
  const subject =
    typeof payload.title === "string"
      ? payload.title
      : typeof payload.excerpt === "string"
        ? payload.excerpt
        : typeof payload.message === "string"
          ? payload.message
          : "";
  const message = JSON.stringify({
    title: "B2BB2G",
    body: subject
      ? `${PUSH_TEXT[notification.type] ?? notification.type} · ${subject}`
      : (PUSH_TEXT[notification.type] ?? notification.type),
    url: pushUrl(notification.type, payload),
    tag: `b2bb2g-${notification.id}`,
  });

  let sent = 0;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          message,
          { TTL: 60 * 60 },
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // The push service says this subscription no longer exists.
        if (status === 404 || status === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        }
      }
    }),
  );

  return NextResponse.json({ ok: true, sent });
}
