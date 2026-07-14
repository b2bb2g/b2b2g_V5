import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { AdminNav, type AdminNavGroup } from "@/components/layout/AdminNav";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Admin console: desktop-first exception to mobile-first (DESIGN section D).
// Grouped sidebar covers every management area (PRD 17: operations complete
// themselves in this console, never in code).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login?next=/admin");
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("admin_staff_assignments")
    .select("permissions, is_active, role")
    .eq("profile_id", session.userId)
    .maybeSingle();
  const isOwner = Boolean(session.profile?.is_admin);
  const permissions = new Set<string>(
    isOwner ? ["*"] : assignment?.is_active ? assignment.permissions ?? [] : [],
  );
  if (!isOwner && permissions.size === 0) redirect("/");

  // Every admin-console visit requires an enrolled factor and an AAL2 session.
  // Enrollment and challenge remain available outside this layout at
  // /dashboard/security, so an existing administrator can recover safely.
  const [{ data: factors }, { data: level }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!(factors?.totp?.some((factor) => factor.status === "verified") ?? false) || level?.currentLevel !== "aal2") {
    redirect("/dashboard/security?mfa=required&next=/admin");
  }

  const { t } = await getT();
  const [
    { count: pendingPosts },
    { count: pendingMessages },
    { count: pendingBadges },
    { count: pendingReports },
  ] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("inquiry_messages").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("badge_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("member_feed_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const can = (permission: string) => isOwner || permissions.has(permission);
  const groups: AdminNavGroup[] = [
    {
      label: t.admin.groupReview,
      items: [
        ...(can("overview") ? [{ href: "/admin", label: t.admin.overview }] : []),
        ...(can("review") ? [
        { href: "/admin/moderation", label: t.admin.moderation, badge: pendingPosts ?? 0 },
        { href: "/admin/feed", label: t.admin.feedSafety, badge: pendingReports ?? 0 },
        { href: "/admin/inquiries", label: t.admin.inquiryModeration, badge: pendingMessages ?? 0 },
        {
          href: "/admin/coordinator-messages",
          label: t.admin.coordinatorMessages,
        },
        { href: "/admin/badges", label: t.admin.badgeAdmin, badge: pendingBadges ?? 0 },
        ] : []),
      ],
    },
    {
      label: t.admin.groupMembers,
      items: can("members") || can("subscriptions") ? [
        ...(can("members") ? [
        { href: "/admin/members", label: t.admin.members },
        { href: "/admin/referrals", label: t.admin.referrals },
        { href: "/admin/invitations", label: t.admin.invitations },
        ] : []),
        ...(can("subscriptions") ? [{ href: "/admin/subscriptions", label: t.admin.subscriptions }] : []),
      ] : [],
    },
    {
      label: t.admin.groupCatalog,
      items: can("catalog") ? [
        { href: "/admin/menus", label: t.admin.menus },
        { href: "/admin/catalog", label: t.admin.catalog },
        { href: "/admin/tiers", label: t.admin.tiers },
      ] : [],
    },
    {
      label: t.admin.groupOperations,
      items: [
        ...(can("content") ? [{ href: "/admin/content", label: t.admin.contentOps }] : []),
        ...(can("notifications") ? [{ href: "/admin/notifications", label: t.admin.notificationPolicy }] : []),
        ...(can("security") ? [{ href: "/admin/security", label: t.admin.securityOps }] : []),
      ],
    },
    {
      label: t.admin.groupSystem,
      items: [
        ...(can("settings") ? [{ href: "/admin/settings", label: t.admin.settings }] : []),
        ...(can("audit") ? [{ href: "/admin/audit", label: t.admin.auditLog }] : []),
        ...(can("team") ? [{ href: "/admin/team", label: t.admin.teamAccess }] : []),
      ],
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="wide space-y-5 pt-4">
      <header className="sticky top-3 z-30 flex items-center justify-between rounded-[1.5rem] border border-line/80 bg-white/88 px-5 py-4 shadow-[0_14px_45px_rgba(25,31,40,.07)] backdrop-blur-xl">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div>
            <p className="text-sm font-extrabold">{t.common.siteName}</p>
            <p className="text-xs font-semibold text-ink-faint">
              {t.admin.title} · {isOwner ? t.admin.staffRoles.manager : t.admin.staffRoles[assignment?.role as keyof typeof t.admin.staffRoles]}
            </p>
          </div>
        </Link>
        <Link href="/" className="btn-secondary btn-sm">
          {t.admin.viewSite}
        </Link>
      </header>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AdminNav groups={groups} badgeLabel={t.admin.awaitingReview} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
