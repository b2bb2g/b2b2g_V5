import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import {
  MESSAGE_REVIEW_STATUS,
  POST_STATUS,
  SUBSCRIPTION_STATUS,
} from "@/lib/constants";

// Request-time window bounds (kept outside the component for lint purity).
function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString();
}

function hoursSince(value?: string): number {
  return value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000)) : 0;
}

export default async function AdminOverviewPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);

  const weekAgo = isoDaysFromNow(-7);
  const soon = isoDaysFromNow(14);

  const [pendingPosts, pendingMessages, pendingBadges, newMembers, expiring] =
    await Promise.all([
      supabase
        .from("posts")
        .select("created_at", { count: "exact" })
        .eq("status", POST_STATUS.PENDING).order("created_at", { ascending: true }).limit(1),
      supabase
        .from("inquiry_messages")
        .select("created_at", { count: "exact" })
        .eq("review_status", MESSAGE_REVIEW_STATUS.PENDING).order("created_at", { ascending: true }).limit(1),
      supabase
        .from("badge_applications")
        .select("created_at", { count: "exact" })
        .eq("status", "pending").order("created_at", { ascending: true }).limit(1),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", SUBSCRIPTION_STATUS.ACTIVE)
        .lte("expires_at", soon),
    ]);

  const cards = [
    { href: "/admin/moderation", label: t.admin.pendingPosts, count: pendingPosts.count ?? 0, age: hoursSince(pendingPosts.data?.[0]?.created_at), queue: true },
    { href: "/admin/inquiries", label: t.admin.pendingInquiries, count: pendingMessages.count ?? 0, age: hoursSince(pendingMessages.data?.[0]?.created_at), queue: true },
    { href: "/admin/badges", label: t.admin.pendingBadges, count: pendingBadges.count ?? 0, age: hoursSince(pendingBadges.data?.[0]?.created_at), queue: true },
    { href: "/admin/members", label: t.admin.newMembers, count: newMembers.count ?? 0, age: 0, queue: false },
    { href: "/admin/subscriptions", label: t.admin.expiringSubs, count: expiring.count ?? 0, age: 0, queue: false },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] bg-ink p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.admin.overview}</p>
        <p className="mt-2 text-3xl font-extrabold">{cards.slice(0, 3).reduce((sum, card) => sum + card.count, 0)}</p>
        <p className="mt-1 text-sm text-white/60">{cards.slice(0,3).some((card) => card.age > 24) ? t.admin.actionQueue : t.admin.queueHealthy}</p>
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
          {card.queue && card.count > 0 && <p className={`mt-3 text-[11px] font-bold ${card.age > 24 ? "text-negative" : "text-positive"}`}>{card.age > 24 ? t.admin.overdue : t.admin.withinSla} · {t.admin.oldestWaiting} {card.age}{t.admin.hours}</p>}
        </Link>
      ))}
      </div>
    </div>
  );
}
