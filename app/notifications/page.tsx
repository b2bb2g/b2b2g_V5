import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { markAllRead, setNotificationState } from "@/app/actions/notifications";
import { NOTIFICATION_STATE } from "@/lib/constants";
import type { AppNotification } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";

// Notification text is derived from type + payload through the language pack
// (no hardcoded strings in stored data).
function renderNotification(t: Dictionary, n: AppNotification): string {
  const p = n.payload as { title?: string; subject?: string; reason?: string };
  const base: Record<string, string> = {
    post_approved: t.post.status.approved,
    post_rejected: t.post.status.rejected,
    message_delivered: t.inquiry.steps.forwarded,
    message_rejected: t.inquiry.steps.rejected,
    badge_approved: t.dashboard.myBadges,
    badge_rejected: t.dashboard.myBadges,
    subscription_expiring: t.dashboard.subscription,
  };
  const label = base[n.type] ?? n.type;
  const subject = p.title ?? p.subject ?? "";
  return subject ? `${label} · ${subject}` : label;
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">{t.notifications.title}</h1>
        {view === "inbox" && notifications.length > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-soft/60"
            >
              {t.notifications.markAllRead}
            </button>
          </form>
        )}
      </div>

      <nav className="flex gap-1">
        {tabs.map((tab) => (
          <a
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
          </a>
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
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {renderNotification(t, n)}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {new Date(n.created_at).toISOString().slice(0, 16).replace("T", " ")}
                </p>
              </div>
              <form action={setNotificationState} className="flex shrink-0 gap-1">
                <input type="hidden" name="id" value={n.id} />
                {view === "inbox" && (
                  <>
                    {n.state === NOTIFICATION_STATE.UNREAD && (
                      <button
                        type="submit"
                        name="state"
                        value={NOTIFICATION_STATE.READ}
                        className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft"
                      >
                        {t.common.confirm}
                      </button>
                    )}
                    <button
                      type="submit"
                      name="state"
                      value={NOTIFICATION_STATE.ARCHIVED}
                      className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft"
                    >
                      {t.notifications.archive}
                    </button>
                    <button
                      type="submit"
                      name="state"
                      value={NOTIFICATION_STATE.TRASHED}
                      className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft"
                    >
                      {t.notifications.trash}
                    </button>
                  </>
                )}
                {view === NOTIFICATION_STATE.ARCHIVED && (
                  <button
                    type="submit"
                    name="state"
                    value={NOTIFICATION_STATE.READ}
                    className="rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft"
                  >
                    {t.notifications.title}
                  </button>
                )}
                {view === NOTIFICATION_STATE.TRASHED && (
                  <button
                    type="submit"
                    name="state"
                    value="delete"
                    className="rounded-lg bg-negative-soft px-2.5 py-1.5 text-[11px] font-semibold text-negative"
                  >
                    {t.notifications.deleteForever}
                  </button>
                )}
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
