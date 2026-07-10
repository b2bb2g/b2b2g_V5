import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
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
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-primary">
            {t.common.siteName}
          </Link>
          <nav className="flex items-center gap-1">
            {session.userId ? (
              <>
                <Link
                  href="/notifications"
                  className="relative rounded-lg p-2 text-ink-soft hover:bg-surface-sub"
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
                  <Link
                    href="/admin"
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-sub"
                  >
                    {t.common.admin}
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-sub"
                >
                  {t.common.dashboard}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-sub"
                >
                  {t.common.signIn}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-strong"
                >
                  {t.common.signUp}
                </Link>
              </>
            )}
          </nav>
        </div>
        {/* Dynamic menu row: admin-managed, variable count, horizontal scroll on overflow */}
        <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 pb-2">
          {menus.map((menu) => (
            <Link
              key={menu.id}
              href={`/${menu.slug}`}
              className="whitespace-nowrap rounded-full bg-surface-sub px-3.5 py-1.5 text-sm font-semibold text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
            >
              {locale === "ko" ? menu.title_ko : menu.title_en}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
