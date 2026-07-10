import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { MenuNav } from "@/components/layout/MenuNav";
import { NOTIFICATION_STATE } from "@/lib/constants";

export async function Header() {
  const [{ t, locale }, menus, session] = await Promise.all([
    getT(),
    getVisibleMenus(),
    getSession(),
  ]);

  let unread = 0;
  if (session.userId) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", session.userId)
      .eq("state", NOTIFICATION_STATE.UNREAD);
    unread = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2" aria-label={t.common.siteName}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-white">
              B
            </span>
            <span className="text-base font-extrabold tracking-tight text-ink">
              {t.common.siteName}
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {session.userId ? (
              <>
                <Link
                  href="/notifications"
                  className="relative rounded-lg p-2 text-ink-soft transition-colors hover:bg-surface-sub"
                  aria-label={t.common.notifications}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
                {session.profile?.is_admin && (
                  <Link href="/admin" className="btn-secondary btn-sm">
                    {t.common.admin}
                  </Link>
                )}
                <Link href="/dashboard" className="btn-soft btn-sm">
                  {t.common.dashboard}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sub"
                >
                  {t.common.signIn}
                </Link>
                <Link href="/signup" className="btn-primary btn-sm px-3.5 py-2">
                  {t.common.signUp}
                </Link>
              </>
            )}
          </nav>
        </div>
        <MenuNav
          items={menus.map((menu) => ({
            id: menu.id,
            slug: menu.slug,
            label: locale === "ko" ? menu.title_ko : menu.title_en,
          }))}
        />
      </div>
    </header>
  );
}
