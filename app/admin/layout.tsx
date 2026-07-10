import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { AdminNav, type AdminNavGroup } from "@/components/layout/AdminNav";
import { PageHeader } from "@/components/ui/PageHeader";

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
  if (!session.profile?.is_admin) redirect("/");

  const { t } = await getT();

  const groups: AdminNavGroup[] = [
    {
      label: t.admin.groupReview,
      items: [
        { href: "/admin", label: t.admin.overview },
        { href: "/admin/moderation", label: t.admin.moderation },
        { href: "/admin/inquiries", label: t.admin.inquiryModeration },
        { href: "/admin/badges", label: t.admin.badgeAdmin },
      ],
    },
    {
      label: t.admin.groupMembers,
      items: [
        { href: "/admin/members", label: t.admin.members },
        { href: "/admin/referrals", label: t.admin.referrals },
        { href: "/admin/subscriptions", label: t.admin.subscriptions },
      ],
    },
    {
      label: t.admin.groupCatalog,
      items: [
        { href: "/admin/menus", label: t.admin.menus },
        { href: "/admin/catalog", label: t.admin.catalog },
        { href: "/admin/tiers", label: t.admin.tiers },
      ],
    },
    {
      label: t.admin.groupSystem,
      items: [
        { href: "/admin/settings", label: t.admin.settings },
        { href: "/admin/audit", label: t.admin.auditLog },
      ],
    },
  ];

  return (
    <div className="wide space-y-5">
      <PageHeader title={t.admin.title} />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <AdminNav groups={groups} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
