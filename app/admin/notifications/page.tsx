import { updateOperationsSetting } from "@/app/actions/admin/operations";
import { getT } from "@/lib/i18n/server";
import { PendingButton } from "@/components/ui/PendingButton";
import { requireAdmin } from "@/app/actions/admin/core";

type Setting = { key: string; value: string | number | boolean };
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * 86400_000).toISOString();

export default async function AdminNotificationsPage() {
  const [{ t, locale }, { supabase }] = await Promise.all([getT(), requireAdmin("notifications")]);
  const since = isoDaysFromNow(-1);
  const [{ data: settings }, { data: events }, { count: failures }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "email_notify_post_approved",
        "email_notify_post_rejected",
        "email_notify_message_delivered",
        "email_notify_message_rejected",
        "email_notify_badge_approved",
        "email_notify_badge_rejected",
        "subscription_expiry_notice_days",
      ])
      .order("key"),
    supabase
      .from("admin_delivery_events")
      .select("id, channel, event_type, status, error_code, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("admin_delivery_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", since),
  ]);
  const labels: Record<string, string> = t.admin.settingLabels;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t.admin.operations}</p>
        <h2 className="mt-2 text-2xl font-extrabold">{t.admin.notificationPolicy}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-faint">{t.admin.notificationPolicyHint}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="card p-5"><p className="text-xs font-bold text-ink-faint">{t.admin.deliveryFailures}</p><p className="mt-2 text-3xl font-extrabold">{failures ?? 0}</p></article>
        <article className="card p-5"><p className="text-xs font-bold text-ink-faint">{t.admin.emailDelivery}</p><p className={`mt-2 text-sm font-semibold ${(failures ?? 0) === 0 ? "text-positive" : "text-negative"}`}>{(failures ?? 0) === 0 ? t.admin.deliveryHealthy : t.admin.deliveryNeedsAttention}</p></article>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.notificationPolicy}</h3></div>
        <div className="divide-y divide-line">
          {((settings ?? []) as Setting[]).map((setting) => {
            const isBool = typeof setting.value === "boolean";
            const isNumber = typeof setting.value === "number";
            return (
              <form key={setting.key} action={updateOperationsSetting} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <input type="hidden" name="permission" value="notifications" />
                <input type="hidden" name="key" value={setting.key} />
                <span><strong className="block text-sm">{labels[setting.key] ?? setting.key}</strong><small className="font-mono text-[11px] text-ink-faint">{setting.key}</small></span>
                {isBool ? (
                  <>
                    <input type="hidden" name="kind" value="boolean" />
                    <input type="hidden" name="value" value={(!setting.value).toString()} />
                    <PendingButton className={`rounded-full px-3 py-1.5 text-xs font-bold ${setting.value ? "bg-positive-soft text-positive" : "bg-surface-sub text-ink-faint"}`}>{setting.value ? t.common.on : t.common.off}</PendingButton>
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <input type="hidden" name="kind" value={isNumber ? "number" : "string"} />
                    <input name="value" type={isNumber ? "number" : "text"} defaultValue={String(setting.value)} className="field w-32 px-3 py-2 text-sm" />
                    <PendingButton className="btn-secondary btn-sm">{t.common.save}</PendingButton>
                  </span>
                )}
              </form>
            );
          })}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.emailDelivery}</h3></div>
        {(events ?? []).length ? <div className="divide-y divide-line">{(events ?? []).map((event) => (
          <article key={event.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]">
            <div><strong className="text-sm">{event.event_type}</strong><p className="mt-1 text-xs text-ink-faint">{event.channel} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</p>{event.error_message ? <p className="mt-2 text-xs text-danger">{event.error_code ? `${event.error_code}: ` : ""}{event.error_message}</p> : null}</div>
            <span className={`self-start rounded-full px-2.5 py-1 text-xs font-bold ${event.status === "failed" ? "bg-danger-soft text-danger" : event.status === "sent" ? "bg-positive-soft text-positive" : "bg-surface-sub text-ink-soft"}`}>{event.status}</span>
          </article>
        ))}</div> : <p className="px-5 py-8 text-center text-sm text-ink-faint">{t.admin.deliveryHealthy}</p>}
      </section>
    </div>
  );
}
