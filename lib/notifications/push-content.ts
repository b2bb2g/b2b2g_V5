// Web-push body copy, kept out of the route handler so no user-facing string
// lives inline. Already localized per recipient by push_subscriptions.locale
// (see app/api/push/dispatch/route.ts); English is the fallback.
export const PUSH_TEXT: Record<string, Record<string, string>> = {
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

export function pushBody(type: string, locale: string, subject: string): string {
  const table = PUSH_TEXT[locale] ?? PUSH_TEXT.en;
  const base = table[type] ?? PUSH_TEXT.en[type] ?? type;
  return subject ? `${base} · ${subject}` : base;
}
