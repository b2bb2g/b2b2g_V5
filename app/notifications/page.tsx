import { redirect } from "next/navigation";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { PushToggle } from "@/components/notifications/PushToggle";
import { MarketingConsentToggle } from "@/components/notifications/MarketingConsentToggle";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  markAllRead,
  openNotification,
  setNotificationState,
} from "@/app/actions/notifications";
import { NotificationsLive } from "@/components/notifications/NotificationsLive";
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
    feed_liked: t.notifications.feedLiked,
    feed_commented: t.notifications.feedCommented,
    feed_comment_liked: t.notifications.feedCommentLiked,
    feed_comment_replied: t.notifications.feedCommentReplied,
    feed_mentioned: t.notifications.feedMentioned,
    app_error_alert: t.notifications.appErrorAlert,
    notice_published: t.notifications.noticePublished,
    subscription_expiring: t.dashboard.subscription,
  };
  const label = base[n.type] ?? n.type;
  const subject = p.title ?? p.subject ?? "";
  return subject ? `${label} · ${subject}` : label;
}

// Same event on the same target collapses into one row ("liked your post
// +2 more"). Only repeatable social/message types group; approvals and
// alerts stay individual.
const GROUPABLE = new Set([
  "feed_liked",
  "feed_commented",
  "feed_comment_liked",
  "feed_comment_replied",
  "message_delivered",
]);

type NotificationGroup = {
  head: AppNotification;
  ids: string[];
  count: number;
  unread: boolean;
};

function groupNotifications(rows: AppNotification[]): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  const index = new Map<string, NotificationGroup>();
  for (const n of rows) {
    const payload = n.payload as { feed_post_id?: string; inquiry_id?: string };
    const target = payload.feed_post_id ?? payload.inquiry_id;
    const key =
      GROUPABLE.has(n.type) && target ? `${n.type}:${target}` : `solo:${n.id}`;
    const existing = index.get(key);
    if (existing) {
      existing.ids.push(n.id);
      existing.count += 1;
      existing.unread ||= n.state === NOTIFICATION_STATE.UNREAD;
    } else {
      const group: NotificationGroup = {
        head: n,
        ids: [n.id],
        count: 1,
        unread: n.state === NOTIFICATION_STATE.UNREAD,
      };
      index.set(key, group);
      groups.push(group);
    }
  }
  return groups;
}

function notificationHref(n: AppNotification): string | null {
  const payload = n.payload as {
    inquiry_id?: string;
    post_id?: string;
    application_id?: string;
    feed_post_id?: string;
  };
  if (n.type === "notice_published" && payload.post_id) {
    return `/notices/${payload.post_id}`;
  }
  if (payload.feed_post_id) {
    const anchor =
      n.type === "feed_liked" ? "" : "#comments";
    return `/feed/${payload.feed_post_id}${anchor}`;
  }
  if (payload.inquiry_id) return `/inquiries/${payload.inquiry_id}`;
  if (payload.post_id) return "/dashboard/posts";
  if (payload.application_id || n.type.startsWith("badge_"))
    return "/dashboard/badges";
  if (n.type === "subscription_expiring") return "/membership";
  if (n.type === "app_error_alert") return "/admin/security";
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

  const [{ data, count }, { data: prefs }] = await Promise.all([
    query,
    supabase
      .from("profile_private")
      .select("push_muted_types, marketing_consent")
      .eq("profile_id", session.userId)
      .maybeSingle(),
  ]);
  const mutedCategories: string[] = prefs?.push_muted_types ?? [];
  const marketingConsent: boolean = prefs?.marketing_consent ?? false;
  const notifications = (data ?? []) as AppNotification[];

  const tabs = [
    { key: "", label: t.notifications.title },
    { key: "archived", label: t.notifications.archived },
    { key: "trash", label: t.notifications.trash },
  ];
  const emptyTitle =
    view === NOTIFICATION_STATE.ARCHIVED
      ? t.notifications.emptyArchived
      : view === NOTIFICATION_STATE.TRASHED
        ? t.notifications.emptyTrash
        : t.notifications.empty;

  return (
    <div className="space-y-5">
      <NotificationsLive userId={session.userId} />
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

      <PushToggle
        initialMuted={mutedCategories}
        labels={{
          title: t.notifications.pushTitle,
          body: t.notifications.pushBody,
          enable: t.notifications.pushEnable,
          disable: t.notifications.pushDisable,
          denied: t.notifications.pushDenied,
          categories: t.notifications.pushCategories,
          categoryLabels: {
            posts: t.notifications.pushCatPosts,
            messages: t.notifications.pushCatMessages,
            badges: t.notifications.pushCatBadges,
            social: t.notifications.pushCatSocial,
            membership: t.notifications.pushCatMembership,
          },
        }}
      />

      <MarketingConsentToggle
        initialConsent={marketingConsent}
        labels={{
          title: t.notifications.marketingTitle,
          body: t.notifications.marketingBody,
          on: t.notifications.marketingOn,
          off: t.notifications.marketingOff,
        }}
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
        <EmptyState title={emptyTitle} />
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-line/70 bg-white shadow-(--shadow-card)">
          <div className="divide-y divide-line">
            {groupNotifications(notifications).map((group) => {
              const n = group.head;
              const unread = group.unread;
              const href = notificationHref(n);
              const groupedSuffix =
                group.count > 1
                  ? ` ${t.notifications.groupedMore.replace("{n}", String(group.count - 1))}`
                  : "";
              const body = (
                <>
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`line-clamp-2 text-sm leading-5 ${unread ? "font-bold text-ink" : "font-semibold text-ink-soft"}`}
                    >
                      {renderNotification(t, n)}
                      {groupedSuffix && (
                        <span className="font-bold text-primary">
                          {groupedSuffix}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-faint">
                      {formatDateTime(n.created_at, locale)}
                    </span>
                  </span>
                </>
              );
              const iconButtonClass =
                "flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink-soft transition hover:bg-primary-soft hover:text-primary-strong";
              return (
                <div
                  key={n.id}
                  className="flex items-start justify-between gap-2 p-4 transition hover:bg-surface-sub/45 sm:gap-3 sm:px-5"
                >
                  {href ? (
                    // Tapping a notification opens it AND reads it (the
                    // group), like any messenger inbox.
                    <form
                      action={openNotification}
                      className="min-w-0 flex-1"
                    >
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="href" value={href} />
                      {group.count > 1 && (
                        <input
                          type="hidden"
                          name="ids"
                          value={JSON.stringify(group.ids)}
                        />
                      )}
                      <button
                        type="submit"
                        className="flex w-full min-w-0 items-start gap-3 rounded-lg text-left focus-visible:outline-offset-4"
                      >
                        {body}
                      </button>
                    </form>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {body}
                    </div>
                  )}
                  <form
                    action={setNotificationState}
                    className="flex shrink-0 justify-end gap-1"
                  >
                    <input type="hidden" name="id" value={n.id} />
                    {group.count > 1 && (
                      <input
                        type="hidden"
                        name="ids"
                        value={JSON.stringify(group.ids)}
                      />
                    )}
                    {view === "inbox" && (
                      <>
                        {unread && (
                          <PendingButton
                            type="submit"
                            name="state"
                            value={NOTIFICATION_STATE.READ}
                            pendingLabel=""
                            title={t.notifications.markRead}
                            className={iconButtonClass}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            <span className="sr-only">
                              {t.notifications.markRead}
                            </span>
                          </PendingButton>
                        )}
                        <PendingButton
                          type="submit"
                          name="state"
                          value={NOTIFICATION_STATE.ARCHIVED}
                          pendingLabel=""
                          title={t.notifications.archive}
                          className={iconButtonClass}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="5" rx="1.5" />
                            <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" />
                          </svg>
                          <span className="sr-only">
                            {t.notifications.archive}
                          </span>
                        </PendingButton>
                        <PendingButton
                          type="submit"
                          name="state"
                          value={NOTIFICATION_STATE.TRASHED}
                          pendingLabel=""
                          title={t.notifications.trash}
                          className={`${iconButtonClass} hover:bg-negative-soft hover:text-negative`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                          </svg>
                          <span className="sr-only">
                            {t.notifications.trash}
                          </span>
                        </PendingButton>
                      </>
                    )}
                    {view === NOTIFICATION_STATE.ARCHIVED && (
                      <PendingButton
                        type="submit"
                        name="state"
                        value={NOTIFICATION_STATE.READ}
                        pendingLabel=""
                        title={t.notifications.restore}
                        className={iconButtonClass}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
                        </svg>
                        <span className="sr-only">
                          {t.notifications.restore}
                        </span>
                      </PendingButton>
                    )}
                    {view === NOTIFICATION_STATE.TRASHED && (
                      <PendingButton
                        type="submit"
                        name="state"
                        value="delete"
                        pendingLabel=""
                        title={t.notifications.deleteForever}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-negative-soft text-negative"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                        </svg>
                        <span className="sr-only">
                          {t.notifications.deleteForever}
                        </span>
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
