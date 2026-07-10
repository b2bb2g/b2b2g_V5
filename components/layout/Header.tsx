import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { MenuNav } from "@/components/layout/MenuNav";
import { AvatarMenu, type AvatarMenuItem } from "@/components/layout/AvatarMenu";
import { LocaleMenu } from "@/components/layout/LocaleMenu";
import { postMediaUrl } from "@/lib/media";
import { BADGE_CODES, NOTIFICATION_STATE } from "@/lib/constants";

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

  // Menu names always display in English (user policy), regardless of locale.
  const menuItems = menus.map((menu) => ({
    id: menu.id,
    slug: menu.slug,
    label: menu.title_en,
  }));

  // Role-aware dropdown entries (member / certified / coordinator / admin).
  // Product/request creation lives here and on the dashboard only.
  const dropdown: AvatarMenuItem[] = [];
  if (session.profile) {
    dropdown.push(
      { href: "/dashboard", label: t.common.dashboard },
      { href: "/dashboard/profile", label: t.nav.profile },
      { href: "/write/select", label: t.dashboard.registerProduct },
      { href: "/write?menu=requests", label: t.dashboard.postRequest },
      { href: "/dashboard/posts", label: t.nav.myPosts },
      { href: "/inquiries", label: t.inquiry.title }
    );
    if (session.badges.some((b) => b.badge_types?.code === BADGE_CODES.CERTIFIED)) {
      dropdown.push({ href: "/dashboard/homepage", label: t.homepage.title });
    }
    if (session.profile.is_coordinator) {
      dropdown.push({ href: "/dashboard/coordinator", label: t.coordinator.title });
    } else if (session.profile.referred_by) {
      dropdown.push({ href: "/dashboard/messages", label: t.coordinator.directMessages });
    }
    if (session.profile.is_admin) {
      dropdown.push({ href: "/admin", label: t.common.admin });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={t.common.siteName}>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-white">
              B
            </span>
            <span className="hidden text-base font-extrabold tracking-tight text-ink sm:block">
              {t.common.siteName}
            </span>
          </Link>

          {/* Desktop: inline dynamic menu */}
          <div className="hidden min-w-0 flex-1 md:block">
            <MenuNav items={menuItems} inline />
          </div>
          <div className="min-w-0 flex-1 md:hidden" />

          <nav className="flex shrink-0 items-center gap-2">
            <LocaleMenu locale={locale} label={t.common.language} />
            {session.userId && session.profile ? (
              <>
                <Link
                  href="/notifications"
                  className="relative rounded-full p-2 text-ink-soft transition-colors hover:bg-surface-sub"
                  aria-label={t.common.notifications}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
                <AvatarMenu
                  name={
                    session.profile.display_name ??
                    session.profile.company_name ??
                    `UID ${session.profile.uid}`
                  }
                  uid={session.profile.uid}
                  avatarUrl={
                    session.profile.avatar_url
                      ? postMediaUrl(session.profile.avatar_url)
                      : null
                  }
                  items={dropdown}
                  signOutLabel={t.common.signOut}
                  copyLabel={t.common.copy}
                  copiedLabel={t.common.copied}
                />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sub"
                >
                  {t.common.signIn}
                </Link>
                <Link href="/signup" className="btn-primary btn-md">
                  {t.common.signUp}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile: scrollable menu row */}
        <div className="md:hidden">
          <MenuNav items={menuItems} />
        </div>
      </div>
    </header>
  );
}
