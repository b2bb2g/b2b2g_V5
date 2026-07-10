import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";

// Admin console: desktop-first exception to mobile-first (DESIGN section D).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login?next=/admin");
  if (!session.profile?.is_admin) redirect("/");

  const { t } = await getT();

  const nav = [
    { href: "/admin", label: t.admin.overview },
    { href: "/admin/moderation", label: t.admin.moderation },
    { href: "/admin/inquiries", label: t.admin.inquiryModeration },
    { href: "/admin/badges", label: t.admin.badgeAdmin },
    { href: "/admin/members", label: t.admin.members },
    { href: "/admin/subscriptions", label: t.admin.subscriptions },
    { href: "/admin/menus", label: t.admin.menus },
    { href: "/admin/catalog", label: t.admin.catalog },
    { href: "/admin/tiers", label: t.admin.tiers },
    { href: "/admin/referrals", label: t.admin.referrals },
    { href: "/admin/settings", label: t.admin.settings },
    { href: "/admin/audit", label: t.admin.auditLog },
  ];

  return (
    <div className="wide space-y-4">
      <h1 className="text-xl font-extrabold">{t.admin.title}</h1>
      <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full bg-surface-sub px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
