import { redirect } from "next/navigation";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
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
import { formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 30;

// Notification text is derived from type + payload through the language pack
// (no hardcoded strings in stored data).
function renderNotification(t: Dictionary, n: AppNotification): string {
  const p = n.payload as {
    title?: string;
    subject?: string;
    reason?: string;
    message?: string;
  };
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
  const payload = n.payload as {
    inquiry_id?: string;
    post_id?: string;
    application_id?: string;
  };
  if (payload.inquiry_id) return `/inquiries/${payload.inquiry_id}`;
  if (payload.post_id) return "/dashboard/posts";
  if (payload.application_id || n.type.startsWith("badge_"))
    return "/dashboard/badges";
  if (n.type === "subscription_expiring") return "/membership";
  return null;
}

export default async function NotificationsPage(props: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t, locale }, params, supabase] = await Promise.all([
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
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("profile_id", session.userId)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  query =
    view === "inbox"
      ? query.in("state", [NOTIFICATION_STATE.UNREAD, NOTIFICATION_STATE.READ])
      : query.eq("state", view);

  const { data, count } = await query;
  const notifications = (data ?? []) as AppNotification[];

  const tabs = [
    { key: "", label: t.notifications.title },
    { key: "archived", label: t.notifications.archived },
    { key: "trash", label: t.notifications.trash },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.notifications.title}
        description={t.notifications.description}
        action={
          view === "inbox" && notifications.length > 0 ? (
            <form action={markAllRead}>
              <PendingButton className="rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-soft/60">
                {t.notifications.markAllRead}
              </PendingButton>
            </form>
          ) : undefined
        }
      />

      <nav className="flex w-fit gap-1 rounded-full bg-surface-sub p-1">
        {tabs.map((tab) => {
          const active =
            (view === "inbox" && !tab.key) ||
            (tab.key === "archived" && view === NOTIFICATION_STATE.ARCHIVED) ||
            (tab.key === "trash" && view === NOTIFICATION_STATE.TRASHED);
          return (
            <Link
              key={tab.key}
              href={
                tab.key ? `/notifications?view=${tab.key}` : "/notifications"
              }
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-[#101923] text-white shadow-sm"
                  : "text-ink-soft hover:text-primary"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {notifications.length === 0 ? (
        <EmptyState title={t.notifications.empty} />
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-line/70 bg-white shadow-(--shadow-card)">
          <div className="divide-y divide-line">
            {notifications.map((n) => {
              const unread = n.state === NOTIFICATION_STATE.UNREAD;
              const href = notificationHref(n);
              const body = (
                <>
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm ${unread ? "font-bold text-ink" : "font-semibold text-ink-soft"}`}
                    >
                      {renderNotification(t, n)}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-faint">
                      {formatDateTime(n.created_at, locale)}
                    </span>
                  </span>
                </>
              );
              return (
                <div
                  key={n.id}
                  className="flex items-start justify-between gap-3 p-4 transition hover:bg-surface-sub/45 sm:px-5"
                >
                  {href ? (
                    <Link
                      href={href}
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-lg focus-visible:outline-offset-4"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {body}
                    </div>
                  )}
                  <form
                    action={setNotificationState}
                    className="flex shrink-0 flex-wrap justify-end gap-1 sm:flex-nowrap"
                  >
                    <input type="hidden" name="id" value={n.id} />
                    {view === "inbox" && (
                      <>
                        {unread && (
                          <PendingButton
                            type="submit"
                            name="state"
                            value={NOTIFICATION_STATE.READ}
                            className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-primary-soft hover:text-primary-strong"
                          >
                            {t.notifications.markRead}
                          </PendingButton>
                        )}
                        <PendingButton
                          type="submit"
                          name="state"
                          value={NOTIFICATION_STATE.ARCHIVED}
                          className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-primary-soft hover:text-primary-strong"
                        >
                          {t.notifications.archive}
                        </PendingButton>
                        <PendingButton
                          type="submit"
                          name="state"
                          value={NOTIFICATION_STATE.TRASHED}
                          className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-primary-soft hover:text-primary-strong"
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
                        className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-primary-soft hover:text-primary-strong"
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
              );
            })}
          </div>
        </div>
      )}
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))}
        basePath="/notifications"
        extraQuery={view === "inbox" ? {} : { view }}
        prevLabel={t.home.prev}
        nextLabel={t.home.next}
      />
    </div>
  );
}
