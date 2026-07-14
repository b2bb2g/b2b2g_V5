import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus, menuTitle } from "@/lib/data/menus";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";

// One icon per board type so the chooser reads at a glance.
const BOARD_ICON: Record<string, ReactNode> = {
  product: (
    <>
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </>
  ),
  request: (
    <>
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h8M8 12h5M16 16h.01" />
    </>
  ),
  flexible: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  notice: (
    <>
      <path d="m3 11 18-5v12L3 14v-3Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
};

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
    <div className="space-y-5">
      <PageHeader title={t.post.chooseBoard} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {writable.map((menu) => (
          <Link
            key={menu.id}
            href={`/write?menu=${menu.slug}`}
            className="group flex flex-col gap-3 rounded-[1.35rem] border border-line/70 bg-white p-5 shadow-(--shadow-card) transition hover:-translate-y-0.5 hover:border-primary/40"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {BOARD_ICON[menu.board_type] ?? BOARD_ICON.product}
              </svg>
            </span>
            <div>
              <p className="text-base font-extrabold text-ink">{menuTitle(menu, locale)}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                {boardTypeLabels[menu.board_type] ?? menu.board_type}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
