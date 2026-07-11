import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { markAllRead, setNotificationState } from "@/app/actions/notifications";
import { NOTIFICATION_STATE } from "@/lib/constants";
import type { AppNotification } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import Link from "next/link";
import { PendingButton } from "@/components/ui/PendingButton";

// Notification text is derived from type + payload through the language pack
// (no hardcoded strings in stored data).
function renderNotification(t: Dictionary, n: AppNotification): string {
  const p = n.payload as { title?: string; subject?: string; reason?: string; message?: string };
  if (n.type === "admin_notice") {
    return p.message
      ? `${t.notifications.teamNotice} · ${p.message}`
      : t.notifications.teamNotice;
  }
  const base: Record<string, string> = {
    post_approved: t.post.status.approved,
    post_rejected: t.post.status.rejected,
    message_delivered: t.inquiry.steps.forwarded,
    message_rejected: t.inquiry.steps.rejected,
    badge_approved: t.notifications.badgeApproved,
    badge_rejected: t.notifications.badgeRejected,
    subscription_expiring: t.dashboard.subscription,
  };
  const label = base[n.type] ?? n.type;
  const subject = p.title ?? p.subject ?? "";
  return subject ? `${label} · ${subject}` : label;
}

function notificationHref(n: AppNotification): string | null {
  const payload = n.payload as { inquiry_id?: string; post_id?: string; application_id?: string };
  if (payload.inquiry_id) return `/inquiries/${payload.inquiry_id}`;
  if (payload.post_id) return "/dashboard/posts";
  if (payload.application_id || n.type.startsWith("badge_")) return "/dashboard/badges";
  if (n.type === "subscription_expiring") return "/membership";
  return null;
}

export default async function NotificationsPage(props: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);

  const view =
    params.view === "archived"
      ? NOTIFICATION_STATE.ARCHIVED
      : params.view === "trash"
        ? NOTIFICATION_STATE.TRASHED
        : "inbox";

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  query =
    view === "inbox"
      ? query.in("state", [NOTIFICATION_STATE.UNREAD, NOTIFICATION_STATE.READ])
      : query.eq("state", view);

  const { data } = await query;
  const notifications = (data ?? []) as AppNotification[];

  const tabs = [
    { key: "", label: t.notifications.title },
    { key: "archived", label: t.notifications.archived },
    { key: "trash", label: t.notifications.trash },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.notifications.title}
        action={
          view === "inbox" && notifications.length > 0 ? (
            <form action={markAllRead}>
              <PendingButton
                className="rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-soft/60"
              >
                {t.notifications.markAllRead}
              </PendingButton>
            </form>
          ) : undefined
        }
      />

      <nav className="flex gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/notifications?view=${tab.key}` : "/notifications"}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              (view === "inbox" && !tab.key) ||
              (tab.key === "archived" && view === NOTIFICATION_STATE.ARCHIVED) ||
              (tab.key === "trash" && view === NOTIFICATION_STATE.TRASHED)
                ? "bg-primary-soft text-primary-strong"
                : "bg-surface-sub text-ink-soft"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {notifications.length === 0 ? (
        <EmptyState title={t.notifications.empty} />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center justify-between gap-3 rounded-card border border-line p-3.5 ${
                n.state === NOTIFICATION_STATE.UNREAD ? "bg-primary-soft/30" : ""
              }`}
            >
              {notificationHref(n) ? (
                <Link href={notificationHref(n)!} className="min-w-0 flex-1 rounded-lg focus-visible:outline-offset-4">
                  <p className="truncate text-sm font-semibold">
                    {renderNotification(t, n)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {new Date(n.created_at).toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                </Link>
              ) : (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {renderNotification(t, n)}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {new Date(n.created_at).toISOString().slice(0, 16).replace("T", " ")}
                </p>
              </div>
              )}
              <form action={setNotificationState} className="flex shrink-0 flex-wrap justify-end gap-1 sm:flex-nowrap">
                <input type="hidden" name="id" value={n.id} />
                {view === "inbox" && (
                  <>
                    {n.state === NOTIFICATION_STATE.UNREAD && (
                      <PendingButton
                        type="submit"
                        name="state"
                        value={NOTIFICATION_STATE.READ}
                        className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft"
                      >
                        {t.notifications.markRead}
                      </PendingButton>
                    )}
                    <PendingButton
                      type="submit"
                      name="state"
                      value={NOTIFICATION_STATE.ARCHIVED}
                      className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft"
                    >
                      {t.notifications.archive}
                    </PendingButton>
                    <PendingButton
                      type="submit"
                      name="state"
                      value={NOTIFICATION_STATE.TRASHED}
                      className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft"
                    >
                      {t.notifications.trash}
                    </PendingButton>
                  </>
                )}
                {view === NOTIFICATION_STATE.ARCHIVED && (
                  <PendingButton
                    type="submit"
                    name="state"
                    value={NOTIFICATION_STATE.READ}
                    className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft"
                  >
                    {t.notifications.restore}
                  </PendingButton>
                )}
                {view === NOTIFICATION_STATE.TRASHED && (
                  <PendingButton
                    type="submit"
                    name="state"
                    value="delete"
                    className="rounded-lg bg-negative-soft px-2.5 py-1.5 text-[11px] font-semibold text-negative"
                  >
                    {t.notifications.deleteForever}
                  </PendingButton>
                )}
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
