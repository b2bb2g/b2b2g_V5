// Parallel email notifications (PRD 10.2). Every type has an admin on/off
// switch in site_settings; emails go out in English (PRD 11: English first).
// Called from admin review actions right after the in-app notification is
// created by the DB trigger. Failures never block the action itself.
import type { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { sendEmail } from "@/lib/email";

type EmailNotificationType =
  | "post_approved"
  | "post_rejected"
  | "message_delivered"
  | "message_rejected"
  | "badge_approved"
  | "badge_rejected";

export const EMAIL_SWITCH_KEYS: Record<EmailNotificationType, string> = {
  post_approved: "email_notify_post_approved",
  post_rejected: "email_notify_post_rejected",
  message_delivered: "email_notify_message_delivered",
  message_rejected: "email_notify_message_rejected",
  badge_approved: "email_notify_badge_approved",
  badge_rejected: "email_notify_badge_rejected",
};

function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendNotificationEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recipientProfileId: string,
  type: EmailNotificationType,
  vars: { title?: string; reason?: string } = {}
): Promise<void> {
  const record = async (status: "sent" | "failed" | "skipped", error?: string) => {
    const { error: logError } = await supabase.from("admin_delivery_events").insert({
      channel: "email",
      event_type: type,
      status,
      recipient_profile_id: recipientProfileId,
      error_code: error === "not_configured" ? "not_configured" : null,
      error_message: error?.slice(0, 500) ?? null,
    });
    if (logError) console.error("notification delivery log failed:", logError.message);
  };
  try {
    const [{ data: setting }, { data: contact }] = await Promise.all([
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", EMAIL_SWITCH_KEYS[type])
        .maybeSingle(),
      supabase
        .from("profile_contacts")
        .select("email")
        .eq("profile_id", recipientProfileId)
        .maybeSingle(),
    ]);

    if (setting?.value !== true || !contact?.email) {
      await record("skipped", setting?.value !== true ? "disabled_by_policy" : "recipient_email_missing");
      return;
    }

    const t = getDictionary("en").emails;
    const templates: Record<EmailNotificationType, { subject: string; body: string }> = {
      post_approved: { subject: t.postApprovedSubject, body: t.postApprovedBody },
      post_rejected: { subject: t.postRejectedSubject, body: t.postRejectedBody },
      message_delivered: { subject: t.messageDeliveredSubject, body: t.messageDeliveredBody },
      message_rejected: { subject: t.messageRejectedSubject, body: t.messageRejectedBody },
      badge_approved: { subject: t.badgeApprovedSubject, body: t.badgeApprovedBody },
      badge_rejected: { subject: t.badgeRejectedSubject, body: t.badgeRejectedBody },
    };

    const safeVars = {
      title: escapeHtml(vars.title ?? ""),
      reason: escapeHtml(vars.reason ?? "-"),
    };
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const siteName = process.env.RESEND_FROM_NAME ?? "B2BB2G";
    const template = templates[type];

    const result = await sendEmail({
      to: contact.email,
      subject: format(template.subject, safeVars),
      html: `<p>${format(template.body, safeVars)}</p><p><a href="${siteUrl}">${format(
        t.openSite,
        { site: siteName }
      )}</a></p>`,
    });
    if (result.sent) {
      await record("sent");
    } else {
      await record(result.error === "not_configured" ? "skipped" : "failed", result.error);
      if (result.error !== "not_configured") console.error("notification email failed:", result.error);
    }
  } catch (error) {
    await record("failed", error instanceof Error ? error.message : "unknown_error");
    console.error("notification email failed:", error);
  }
}
