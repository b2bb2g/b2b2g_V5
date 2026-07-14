import Link from "next/link";
import { updateOperationsSetting } from "@/app/actions/admin/operations";
import { PendingButton } from "@/components/ui/PendingButton";
import { getT } from "@/lib/i18n/server";
import { requireAdmin } from "@/app/actions/admin/core";
import { revokeMemberDevice } from "@/app/actions/admin/security";

type Setting = { key: string; value: string | number | boolean };
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * 86400_000).toISOString();

export default async function AdminSecurityPage() {
  const [{ t, locale }, { supabase }] = await Promise.all([getT(), requireAdmin("security")]);
  const dayAgo = isoDaysFromNow(-1);
  const weekAgo = isoDaysFromNow(-7);
  const now = isoDaysFromNow(0);
  const [
    { count: failedCount },
    { count: riskCount },
    { count: invitationCount },
    { count: deviceCount },
    { data: riskEvents },
    { data: failures },
    { data: settings },
    { data: devices },
  ] = await Promise.all([
    supabase.from("login_failure_events").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
    supabase.from("login_events").select("id", { count: "exact", head: true }).neq("risk_level", "normal").gte("created_at", weekAgo),
    supabase.from("referral_invitations").select("id", { count: "exact", head: true }).in("status", ["active", "reserved"]).gt("expires_at", now),
    supabase.from("trusted_devices").select("id", { count: "exact", head: true }),
    supabase.from("login_events").select("id, profile_id, device_label, ip_masked, country, city, risk_level, is_new_device, created_at, profiles(uid)").neq("risk_level", "normal").order("created_at", { ascending: false }).limit(20),
    supabase.from("login_failure_events").select("id, profile_id, ip_masked, country, user_agent, created_at, profiles(uid)").order("created_at", { ascending: false }).limit(20),
    supabase.from("site_settings").select("key, value").in("key", ["login_session_policy", "new_device_email_alert", "suspicious_login_email_alert", "failed_login_threshold", "security_log_retention_days"]).order("key"),
    supabase.from("trusted_devices").select("id, profile_id, label, last_ip_masked, last_country, last_seen_at, profiles(uid)").order("last_seen_at", { ascending: false }).limit(20),
  ]);
  const labels: Record<string, string> = t.admin.settingLabels;
  const format = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t.admin.operations}</p>
        <h2 className="mt-2 text-2xl font-extrabold">{t.admin.securityOps}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-faint">{t.admin.securityOpsHint}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t.admin.loginFailures, failedCount ?? 0, failedCount ? "text-danger" : "text-positive"],
          [t.admin.riskyLogins, riskCount ?? 0, riskCount ? "text-warning" : "text-positive"],
          [t.admin.activeInvitations, invitationCount ?? 0, "text-primary"],
          [t.admin.trustedDevices, deviceCount ?? 0, "text-ink"],
        ].map(([label, value, tone]) => <article key={String(label)} className="card p-5"><p className="text-xs font-bold text-ink-faint">{label}</p><p className={`mt-2 text-3xl font-extrabold ${tone}`}>{value}</p></article>)}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.securityOps}</h3></div>
        <div className="divide-y divide-line">
          {((settings ?? []) as Setting[]).map((setting) => {
            const isBool = typeof setting.value === "boolean";
            const isNumber = typeof setting.value === "number";
            return <form key={setting.key} action={updateOperationsSetting} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <input type="hidden" name="permission" value="security" /><input type="hidden" name="key" value={setting.key} />
              <span><strong className="block text-sm">{labels[setting.key] ?? setting.key}</strong><small className="font-mono text-[11px] text-ink-faint">{setting.key}</small></span>
              {isBool ? <><input type="hidden" name="kind" value="boolean" /><input type="hidden" name="value" value={(!setting.value).toString()} /><PendingButton className={`rounded-full px-3 py-1.5 text-xs font-bold ${setting.value ? "bg-positive-soft text-positive" : "bg-surface-sub text-ink-faint"}`}>{setting.value ? t.common.on : t.common.off}</PendingButton></> : setting.key === "login_session_policy" ? <span className="flex gap-2"><input type="hidden" name="kind" value="string" /><select name="value" defaultValue={String(setting.value)} className="field px-3 py-2 text-sm"><option value="multi">multi</option><option value="single">single</option></select><PendingButton className="btn-secondary btn-sm">{t.common.save}</PendingButton></span> : <span className="flex gap-2"><input type="hidden" name="kind" value={isNumber ? "number" : "string"} /><input name="value" type={isNumber ? "number" : "text"} defaultValue={String(setting.value)} className="field w-32 px-3 py-2 text-sm" /><PendingButton className="btn-secondary btn-sm">{t.common.save}</PendingButton></span>}
            </form>;
          })}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.recentSecurityEvents}</h3></div>
        {riskEvents?.length ? <div className="divide-y divide-line">{riskEvents.map((event) => {
          const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles;
          return <article key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><Link href={`/admin/members/${event.profile_id}`} className="text-sm font-extrabold text-primary">UID:{profile?.uid}</Link><p className="mt-1 text-xs text-ink-faint">{event.device_label || t.admin.device} · {event.ip_masked || "—"} · {[event.city, event.country].filter(Boolean).join(", ") || "—"}</p></div><div className="text-right"><span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning">{event.risk_level}</span><p className="mt-2 text-xs text-ink-faint">{format(event.created_at)}</p></div></article>;
        })}</div> : <p className="px-5 py-8 text-center text-sm text-ink-faint">{t.admin.noSecurityEvents}</p>}
      </section>

      {failures?.length ? <section className="card overflow-hidden"><div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.loginFailures}</h3></div><div className="divide-y divide-line">{failures.map((event) => {
        const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles;
        return <article key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div>{profile?.uid ? <Link href={`/admin/members/${event.profile_id}`} className="text-sm font-extrabold text-primary">UID:{profile.uid}</Link> : <strong className="text-sm">{t.admin.unknownAccount}</strong>}<p className="mt-1 max-w-xl truncate text-xs text-ink-faint">{event.ip_masked || "—"} · {event.country || "—"} · {event.user_agent || "—"}</p></div><time className="text-xs text-ink-faint">{format(event.created_at)}</time></article>;
      })}</div></section> : null}

      <section className="card overflow-hidden"><div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.trustedDevices}</h3></div>{devices?.length ? <div className="divide-y divide-line">{devices.map((device) => {
        const profile = Array.isArray(device.profiles) ? device.profiles[0] : device.profiles;
        return <article key={device.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><Link href={`/admin/members/${device.profile_id}`} className="text-sm font-extrabold text-primary">UID:{profile?.uid}</Link><p className="mt-1 text-xs text-ink-faint">{device.label} · {device.last_ip_masked || "—"} · {device.last_country || "—"} · {format(device.last_seen_at)}</p></div><form action={revokeMemberDevice}><input type="hidden" name="deviceId" value={device.id} /><input type="hidden" name="profileId" value={device.profile_id} /><PendingButton className="btn-danger btn-sm">{t.admin.revokeDevice}</PendingButton></form></article>;
      })}</div> : <p className="px-5 py-8 text-center text-sm text-ink-faint">{t.admin.noTrustedDevices}</p>}</section>
    </div>
  );
}
