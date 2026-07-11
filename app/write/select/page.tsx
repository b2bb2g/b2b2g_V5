import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus, menuTitle } from "@/lib/data/menus";
import { PageHeader } from "@/components/ui/PageHeader";

// Board chooser: the entry point for "register a product / write a post"
// actions on the dashboard. Shows only boards the member may write in.
export default async function WriteSelectPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?next=/write/select");

  const [{ t, locale }, menus] = await Promise.all([getT(), getVisibleMenus()]);
  const writable = menus.filter(
    (menu) => menu.member_write || session.profile?.is_admin
  );
  const boardTypeLabels: Record<string, string> = t.admin.boardTypes;

  return (
    <div className="space-y-4">
      <PageHeader title={t.post.chooseBoard} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {writable.map((menu) => (
          <Link key={menu.id} href={`/write?menu=${menu.slug}`} className="card-hover group block p-5">
            <p className="text-base font-bold text-ink">{menuTitle(menu, locale)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
              {boardTypeLabels[menu.board_type] ?? menu.board_type}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
