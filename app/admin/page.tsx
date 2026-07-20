import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { TrendSparkline, type TrendBin } from "@/components/admin/TrendSparkline";
import {
  MESSAGE_REVIEW_STATUS,
  POST_STATUS,
  SETTING_KEYS,
  SUBSCRIPTION_STATUS,
} from "@/lib/constants";
import { requireAdmin, type AdminPermission } from "@/app/actions/admin/core";

// Request-time window bounds (kept outside the component for lint purity).
function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString();
}

function hoursSince(value?: string): number {
  return value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000)) : 0;
}

// 30 daily buckets, oldest first. Rows arrive newest-first so a truncated
// fetch undercounts the oldest days, never the recent ones.
function binDaily(rows: { created_at: string }[], days = 30): TrendBin[] {
  const bins: TrendBin[] = [];
  const today = Date.now();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    bins.push({
      date: new Date(today - offset * 86400_000).toISOString().slice(0, 10),
      count: 0,
    });
  }
  const index = new Map(bins.map((bin, i) => [bin.date, i]));
  for (const row of rows) {
    const slot = index.get(row.created_at.slice(0, 10));
    if (slot !== undefined) bins[slot].count += 1;
  }
  return bins;
}

function lastDaysTotal(bins: TrendBin[], days: number): number {
  return bins.slice(-days).reduce((sum, bin) => sum + bin.count, 0);
}

export default async function AdminOverviewPage() {
  const [{ t }, access] = await Promise.all([
    getT(),
    requireAdmin("overview"),
  ]);
  const { supabase, isOwner, permissions } = access;
  const can = (permission: AdminPermission) =>
    isOwner || permissions.includes(permission);
  const canReview = can("review");
  const canMembers = can("members");
  const canSubscriptions = can("subscriptions");
  const canContent = can("content");
  const canNotifications = can("notifications");
  const canSecurity = can("security");
  const canTeam = can("team");

  const weekAgo = isoDaysFromNow(-7);
  const monthAgo = isoDaysFromNow(-30);
  const soon = isoDaysFromNow(14);

  const dayAgo = isoDaysFromNow(-1);
  const [pendingPosts, pendingMessages, pendingBadges, newMembers, expiring, approvedPosts, recentInquiries, pendingReports, deliveryFailures, riskyLogins, activeStaff, slaSetting] =
    await Promise.all([
      canReview ? supabase
        .from("posts")
        .select("created_at", { count: "exact" })
        .eq("status", POST_STATUS.PENDING).order("created_at", { ascending: true }).limit(1) : Promise.resolve({ data: [], count: 0 }),
      canReview ? supabase
        .from("inquiry_messages")
        .select("created_at", { count: "exact" })
        .eq("review_status", MESSAGE_REVIEW_STATUS.PENDING).order("created_at", { ascending: true }).limit(1) : Promise.resolve({ data: [], count: 0 }),
      canReview ? supabase
        .from("badge_applications")
        .select("created_at", { count: "exact" })
        .eq("status", "pending").order("created_at", { ascending: true }).limit(1) : Promise.resolve({ data: [], count: 0 }),
      canMembers ? supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo) : Promise.resolve({ data: null, count: 0 }),
      canSubscriptions ? supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", SUBSCRIPTION_STATUS.ACTIVE)
        .lte("expires_at", soon) : Promise.resolve({ data: null, count: 0 }),
      canReview || canContent ? supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", POST_STATUS.APPROVED) : Promise.resolve({ data: null, count: 0 }),
      canReview ? supabase.from("inquiries").select("created_at, updated_at, status", { count: "exact" }).gte("created_at", monthAgo) : Promise.resolve({ data: [], count: 0 }),
      canReview ? supabase.from("member_feed_reports").select("id", { count: "exact", head: true }).eq("status", "pending") : Promise.resolve({ data: null, count: 0 }),
      canNotifications ? supabase.from("admin_delivery_events").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", dayAgo) : Promise.resolve({ data: null, count: 0 }),
      canSecurity ? supabase.from("login_events").select("id", { count: "exact", head: true }).neq("risk_level", "normal").gte("created_at", weekAgo) : Promise.resolve({ data: null, count: 0 }),
      canTeam ? supabase.from("admin_staff_assignments").select("profile_id", { count: "exact", head: true }).eq("is_active", true) : Promise.resolve({ data: null, count: 0 }),
      supabase.from("site_settings").select("value").eq("key", SETTING_KEYS.ADMIN_QUEUE_SLA_HOURS).maybeSingle(),
    ]);

  // 30-day trend rows (created_at only, newest first for safe truncation).
  const [signupRows, postRows, inquiryRows] = await Promise.all([
    canMembers
      ? supabase.from("profiles").select("created_at").gte("created_at", monthAgo).order("created_at", { ascending: false }).limit(1000)
      : Promise.resolve({ data: [] as { created_at: string }[] }),
    canReview || canContent
      ? supabase.from("posts").select("created_at").gte("created_at", monthAgo).order("created_at", { ascending: false }).limit(1000)
      : Promise.resolve({ data: [] as { created_at: string }[] }),
    canReview
      ? supabase.from("inquiries").select("created_at").gte("created_at", monthAgo).order("created_at", { ascending: false }).limit(1000)
      : Promise.resolve({ data: [] as { created_at: string }[] }),
  ]);
  const trends = [
    ...(canMembers ? [{ title: t.admin.trendSignups, bins: binDaily(signupRows.data ?? []) }] : []),
    ...(canReview || canContent ? [{ title: t.admin.trendPosts, bins: binDaily(postRows.data ?? []) }] : []),
    ...(canReview ? [{ title: t.admin.trendInquiries, bins: binDaily(inquiryRows.data ?? []) }] : []),
  ];

  const slaHours = typeof slaSetting.data?.value === "number" ? Math.max(1, slaSetting.data.value) : 24;

  const progressed = (recentInquiries.data ?? []).filter((item) => item.status !== "sent" && item.status !== "admin_review");
  const averageHours = progressed.length
    ? Math.round(progressed.reduce((sum, item) => sum + Math.max(0, new Date(item.updated_at).getTime() - new Date(item.created_at).getTime()), 0) / progressed.length / 3_600_000)
    : 0;
  const conversion = approvedPosts.count ? Math.round(((recentInquiries.count ?? 0) / approvedPosts.count) * 100) : 0;

  const cards = [
    ...(canReview ? [
      { href: "/admin/moderation", label: t.admin.pendingPosts, count: pendingPosts.count ?? 0, age: hoursSince(pendingPosts.data?.[0]?.created_at), queue: true },
      { href: "/admin/inquiries", label: t.admin.pendingInquiries, count: pendingMessages.count ?? 0, age: hoursSince(pendingMessages.data?.[0]?.created_at), queue: true },
      { href: "/admin/badges", label: t.admin.pendingBadges, count: pendingBadges.count ?? 0, age: hoursSince(pendingBadges.data?.[0]?.created_at), queue: true },
    ] : []),
    ...(canMembers ? [{ href: "/admin/members", label: t.admin.newMembers, count: newMembers.count ?? 0, age: 0, queue: false }] : []),
    ...(canSubscriptions ? [{ href: "/admin/subscriptions", label: t.admin.expiringSubs, count: expiring.count ?? 0, age: 0, queue: false }] : []),
  ];

  const queueCards = cards.filter((card) => card.queue);
  const healthMetrics = [
    ...(canReview ? [{ href: "/admin/feed", label: t.admin.pendingReports, value: pendingReports.count ?? 0, alert: (pendingReports.count ?? 0) > 0 }] : []),
    ...(canNotifications ? [{ href: "/admin/notifications", label: t.admin.deliveryFailures, value: deliveryFailures.count ?? 0, alert: (deliveryFailures.count ?? 0) > 0 }] : []),
    ...(canSecurity ? [{ href: "/admin/security", label: t.admin.riskyLogins, value: riskyLogins.count ?? 0, alert: (riskyLogins.count ?? 0) > 0 }] : []),
    ...(canTeam ? [{ href: "/admin/team", label: t.admin.activeStaff, value: activeStaff.count ?? 0, alert: false }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] bg-ink p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.admin.overview}</p>
        <p className="mt-2 text-3xl font-extrabold">{queueCards.reduce((sum, card) => sum + card.count, 0)}</p>
        <p className="mt-1 text-sm text-white/60">{queueCards.some((card) => card.age > slaHours) ? t.admin.actionQueue : t.admin.queueHealthy}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.href + card.label}
          href={card.href}
          className={`group rounded-card border p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-(--shadow-card) ${
            card.count > 0 ? "border-primary/40 bg-primary-soft/30" : "border-line"
          }`}
        >
          <div className="flex items-start justify-between"><p className="text-2xl font-extrabold">{card.count}</p><span className="text-ink-faint transition group-hover:translate-x-1 group-hover:text-primary">→</span></div>
          <p className="mt-1 text-xs font-semibold text-ink-soft">{card.label}</p>
          {card.queue && card.count > 0 && <p className={`mt-3 text-[11px] font-bold ${card.age > slaHours ? "text-negative" : "text-positive"}`}>{card.age > slaHours ? t.admin.overdue : t.admin.withinSla} · {t.admin.oldestWaiting} {card.age}{t.admin.hours}</p>}
        </Link>
      ))}
      </div>
      {trends.length > 0 && <section className="rounded-[1.5rem] border border-line bg-surface p-5 shadow-(--shadow-card)">
        <h2 className="text-base font-extrabold">{t.admin.trendsTitle}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {trends.map((trend) => (
            <TrendSparkline
              key={trend.title}
              title={trend.title}
              bins={trend.bins}
              recentLabel={t.admin.trendRecentWeek}
              recentCount={lastDaysTotal(trend.bins, 7)}
            />
          ))}
        </div>
      </section>}
      {(canReview || canContent) && <section className="rounded-[1.5rem] border border-line bg-surface p-5 shadow-(--shadow-card)">
        <h2 className="text-base font-extrabold">{t.admin.performanceTitle}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[{label:t.admin.conversionRate,value:`${conversion}%`},{label:t.admin.avgResponseTime,value:`${averageHours}${t.admin.hours}`},{label:t.admin.approvedInventory,value:approvedPosts.count ?? 0},{label:t.admin.activeInquiries,value:recentInquiries.count ?? 0}].map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-surface-sub p-4"><p className="text-2xl font-extrabold tracking-tight">{metric.value}</p><p className="mt-1 text-xs font-semibold text-ink-soft">{metric.label}</p></div>
          ))}
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-sub"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${Math.min(100,conversion)}%`}} /></div>
      </section>}
      {healthMetrics.length > 0 && <section className="rounded-[1.5rem] border border-line bg-surface p-5 shadow-(--shadow-card)">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-extrabold">{t.admin.operationsHealth}</h2><p className="mt-1 text-xs text-ink-faint">{t.admin.operationsHealthHint}</p></div>{canSecurity && <Link href="/admin/security" className="text-xs font-bold text-primary">{t.admin.securityOps} →</Link>}</div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {healthMetrics.map((metric) => <Link key={metric.href} href={metric.href} className={`rounded-2xl p-4 transition hover:-translate-y-0.5 ${metric.alert ? "bg-negative-soft" : "bg-surface-sub"}`}><p className={`text-2xl font-extrabold ${metric.alert ? "text-negative" : ""}`}>{metric.value}</p><p className="mt-1 text-xs font-semibold text-ink-soft">{metric.label}</p></Link>)}
        </div>
      </section>}
    </div>
  );
}
