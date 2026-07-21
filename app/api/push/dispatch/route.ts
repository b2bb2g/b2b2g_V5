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

const PUSH_TEXT: Record<string, Record<string, string>> = {
  en: {
    post_approved: "Your post was published",
    post_rejected: "Your post was returned after review",
    message_delivered: "A new message arrived in your inbox",
    message_rejected: "Your message was returned after review",
    badge_approved: "Your badge application was approved",
    badge_rejected: "Your badge application was returned",
    subscription_expiring: "Your membership is expiring soon",
    feed_liked: "Someone liked your post",
    feed_commented: "New comment on your post",
    feed_comment_liked: "Someone liked your comment",
    feed_comment_replied: "New reply to your comment",
    feed_mentioned: "You were mentioned in a comment",
    admin_notice: "Notice from the operations team",
    notice_published: "New notice",
    app_error_alert: "Application error detected",
  },
  ko: {
    post_approved: "게시물이 게시되었습니다",
    post_rejected: "게시물이 검토 후 반려되었습니다",
    message_delivered: "새 메시지가 도착했습니다",
    message_rejected: "메시지가 검토 후 반려되었습니다",
    badge_approved: "배지 신청이 승인되었습니다",
    badge_rejected: "배지 신청이 반려되었습니다",
    subscription_expiring: "멤버십 만료가 임박했습니다",
    feed_liked: "회원님의 게시물을 좋아합니다",
    feed_commented: "게시물에 새 댓글이 달렸습니다",
    feed_comment_liked: "회원님의 댓글을 좋아합니다",
    feed_comment_replied: "댓글에 새 답글이 달렸습니다",
    feed_mentioned: "댓글에서 회원님이 언급되었습니다",
    admin_notice: "운영팀 공지가 도착했습니다",
    notice_published: "새 공지사항이 등록되었습니다",
    app_error_alert: "애플리케이션 오류가 감지되었습니다",
  },
};

function pushBody(type: string, locale: string, subject: string): string {
  const table = PUSH_TEXT[locale] ?? PUSH_TEXT.en;
  const base = table[type] ?? PUSH_TEXT.en[type] ?? type;
  return subject ? `${base} · ${subject}` : base;
}

function pushCategory(type: string): string | null {
  if (type.startsWith("post_")) return "posts";
  if (type.startsWith("message_")) return "messages";
  if (type.startsWith("badge_")) return "badges";
  if (type.startsWith("feed_")) return "social";
  if (type === "subscription_expiring") return "membership";
  return null;
}

function pushUrl(type: string, payload: Record<string, unknown>): string {
  if (type === "notice_published" && typeof payload.post_id === "string") {
    return `/notices/${payload.post_id}`;
  }
  if (typeof payload.feed_post_id === "string") {
    const anchor = type === "feed_liked" ? "" : "#comments";
    return `/feed/${payload.feed_post_id}${anchor}`;
  }
  if (typeof payload.inquiry_id === "string")
    return `/inquiries/${payload.inquiry_id}`;
  if (typeof payload.post_id === "string") return "/dashboard/posts";
  if (type.startsWith("badge_")) return "/dashboard/badges";
  if (type === "subscription_expiring") return "/membership";
  if (type === "app_error_alert") return "/admin/security";
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
  // Notices are badge-only: in-app bell yes, web push no (the DB trigger
  // already skips the dispatch ping; this guards any direct call).
  if (notification.type === "notice_published") {
    return NextResponse.json({ ok: true, skipped: "badge_only" });
  }
  if (Date.now() - new Date(notification.created_at).getTime() > MAX_AGE_MS) {
    return NextResponse.json({ ok: false, reason: "stale" });
  }

  const category = pushCategory(notification.type);
  if (category) {
    const { data: profile } = await supabase
      .from("profile_private")
      .select("push_muted_types")
      .eq("profile_id", notification.profile_id)
      .maybeSingle();
    if ((profile?.push_muted_types ?? []).includes(category)) {
      return NextResponse.json({ ok: true, muted: true });
    }
  }

  // Pre-migration deployments have no locale column; retry without it.
  let subscriptions:
    | { id: string; endpoint: string; p256dh: string; auth: string; locale?: string }[]
    | null = null;
  const withLocale = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, locale")
    .eq("profile_id", notification.profile_id);
  if (withLocale.error) {
    const fallback = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("profile_id", notification.profile_id);
    subscriptions = fallback.data;
  } else {
    subscriptions = withLocale.data;
  }
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
  const url = pushUrl(notification.type, payload);

  let sent = 0;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: "B2BB2G",
            body: pushBody(
              notification.type,
              subscription.locale ?? "en",
              subject,
            ),
            url,
            tag: `b2bb2g-${notification.id}`,
          }),
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
