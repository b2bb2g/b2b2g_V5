import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { AdminNav, type AdminNavGroup } from "@/components/layout/AdminNav";
import { AdminSectionHint } from "@/components/admin/AdminSectionHint";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Plain line icons per menu category (no emoji). Static, so defined once.
function navIcon(paths: React.ReactNode) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
const NAV_ICONS = {
  home: navIcon(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </>,
  ),
  review: navIcon(
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="m9 13 2 2 4-4" />
    </>,
  ),
  members: navIcon(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16.5 5.5a3 3 0 0 1 0 6" />
      <path d="M17.5 14.2A6 6 0 0 1 21 20" />
    </>,
  ),
  catalog: navIcon(
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>,
  ),
  content: navIcon(
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5 2 5.5H4c.5-.5 2-1.5 2-5.5z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>,
  ),
  system: navIcon(
    <>
      <path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6z" />
      <path d="m9 12 2 2 4-4" />
    </>,
  ),
};

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
  const [pendingPostsResult, pendingMessagesResult, pendingBadgesResult, pendingReportsResult, pendingCommentReportsResult] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("inquiry_messages").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("badge_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("member_feed_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("member_feed_comment_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const queueCountError = [
    pendingPostsResult.error,
    pendingMessagesResult.error,
    pendingBadgesResult.error,
    pendingReportsResult.error,
    pendingCommentReportsResult.error,
  ].find(Boolean);
  if (queueCountError) {
    console.error("[admin] review queue counts unavailable", queueCountError);
  }
  const pendingPosts = pendingPostsResult.error ? undefined : pendingPostsResult.count ?? 0;
  const pendingMessages = pendingMessagesResult.error ? undefined : pendingMessagesResult.count ?? 0;
  const pendingBadges = pendingBadgesResult.error ? undefined : pendingBadgesResult.count ?? 0;
  const pendingReports =
    pendingReportsResult.error || pendingCommentReportsResult.error
      ? undefined
      : (pendingReportsResult.count ?? 0) +
        (pendingCommentReportsResult.count ?? 0);

  const can = (permission: string) => isOwner || permissions.has(permission);
  // Task-first categories, ordered by how often an operator reaches for them.
  const groups: AdminNavGroup[] = [
    {
      label: t.admin.groupHome,
      description: t.admin.groupHomeDesc,
      icon: NAV_ICONS.home,
      items: can("overview") ? [{ href: "/admin", label: t.admin.overview }] : [],
    },
    {
      label: t.admin.groupReview,
      description: t.admin.groupReviewDesc,
      icon: NAV_ICONS.review,
      items: can("review")
        ? [
            { href: "/admin/moderation", label: t.admin.moderation, badge: pendingPosts },
            { href: "/admin/feed", label: t.admin.feedSafety, badge: pendingReports },
            { href: "/admin/inquiries", label: t.admin.inquiryModeration, badge: pendingMessages },
            { href: "/admin/coordinator-messages", label: t.admin.coordinatorMessages },
            { href: "/admin/badges", label: t.admin.badgeAdmin, badge: pendingBadges },
          ]
        : [],
    },
    {
      label: t.admin.groupMembers,
      description: t.admin.groupMembersDesc,
      icon: NAV_ICONS.members,
      items: [
        ...(can("members")
          ? [
              { href: "/admin/members", label: t.admin.members },
              { href: "/admin/referrals", label: t.admin.referrals },
              { href: "/admin/invitations", label: t.admin.invitations },
            ]
          : []),
        ...(can("subscriptions") ? [{ href: "/admin/subscriptions", label: t.admin.subscriptions }] : []),
      ],
    },
    {
      label: t.admin.groupCatalog,
      description: t.admin.groupCatalogDesc,
      icon: NAV_ICONS.catalog,
      items: can("catalog")
        ? [
            { href: "/admin/menus", label: t.admin.menus },
            { href: "/admin/catalog", label: t.admin.catalog },
            { href: "/admin/tiers", label: t.admin.tiers },
          ]
        : [],
    },
    {
      label: t.admin.groupOperations,
      description: t.admin.groupOperationsDesc,
      icon: NAV_ICONS.content,
      items: [
        ...(can("content") ? [{ href: "/admin/content", label: t.admin.contentOps }] : []),
        ...(can("notifications") ? [{ href: "/admin/notifications", label: t.admin.notificationPolicy }] : []),
      ],
    },
    {
      label: t.admin.groupSystem,
      description: t.admin.groupSystemDesc,
      icon: NAV_ICONS.system,
      items: [
        ...(can("settings") ? [{ href: "/admin/settings", label: t.admin.settings }] : []),
        ...(can("security") ? [{ href: "/admin/security", label: t.admin.securityOps }] : []),
        ...(can("audit") ? [{ href: "/admin/audit", label: t.admin.auditLog }] : []),
        ...(can("team") ? [{ href: "/admin/team", label: t.admin.teamAccess }] : []),
      ],
    },
  ].filter((group) => group.items.length > 0);

  // Per-section plain-language hint, shown once above the page by the layout.
  const sectionHints: Record<string, string> = {
    "/admin/moderation": t.admin.intro.moderation,
    "/admin/feed": t.admin.intro.feed,
    "/admin/inquiries": t.admin.intro.inquiries,
    "/admin/coordinator-messages": t.admin.intro.coordinatorMessages,
    "/admin/badges": t.admin.intro.badges,
    "/admin/members": t.admin.intro.members,
    "/admin/referrals": t.admin.intro.referrals,
    "/admin/invitations": t.admin.intro.invitations,
    "/admin/subscriptions": t.admin.intro.subscriptions,
    "/admin/menus": t.admin.intro.menus,
    "/admin/catalog": t.admin.intro.catalog,
    "/admin/tiers": t.admin.intro.tiers,
    "/admin/content": t.admin.intro.content,
    "/admin/notifications": t.admin.intro.notifications,
    "/admin/security": t.admin.intro.security,
    "/admin/settings": t.admin.intro.settings,
    "/admin/audit": t.admin.intro.audit,
    "/admin/team": t.admin.intro.team,
  };

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
        <div className="min-w-0 space-y-4">
          <AdminSectionHint hints={sectionHints} />
          {queueCountError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="status">
              {t.admin.queueCountsUnavailable}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
