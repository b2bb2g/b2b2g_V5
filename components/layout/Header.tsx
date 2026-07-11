import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus, menuTitle } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { MenuNav } from "@/components/layout/MenuNav";
import {
  AvatarMenu,
  type AvatarMenuItem,
} from "@/components/layout/AvatarMenu";
import { LocaleMenu } from "@/components/layout/LocaleMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { postMediaUrl } from "@/lib/media";
import { BADGE_CODES, NOTIFICATION_STATE } from "@/lib/constants";
import { MobileMenu } from "@/components/layout/MobileMenu";

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

  // Menu names follow the admin menu settings per locale (EN/KO fields).
  const menuItems = menus.map((menu) => ({
    id: menu.id,
    slug: menu.slug,
    label: menuTitle(menu, locale),
  }));

  // Role-aware dropdown entries (member / certified / coordinator / admin).
  // Product/request creation lives here and on the dashboard only.
  const dropdown: AvatarMenuItem[] = [];
  if (session.profile) {
    dropdown.push(
      { href: "/dashboard", label: t.common.dashboard },
      { href: "/feed", label: t.feed.title },
      { href: "/dashboard/profile", label: t.nav.profile },
      { href: "/write/select", label: t.dashboard.registerProduct },
      { href: "/write?menu=requests", label: t.dashboard.postRequest },
      { href: "/dashboard/posts", label: t.nav.myPosts },
      { href: "/inquiries", label: t.inquiry.title },
    );
    if (
      session.badges.some((b) => b.badge_types?.code === BADGE_CODES.CERTIFIED)
    ) {
      dropdown.push({ href: "/dashboard/homepage", label: t.homepage.title });
    }
    if (session.profile.is_coordinator) {
      dropdown.push({
        href: "/dashboard/coordinator",
        label: t.coordinator.title,
      });
    } else if (session.profile.referred_by) {
      dropdown.push({
        href: "/dashboard/messages",
        label: t.coordinator.directMessages,
      });
    }
    if (session.profile.is_admin) {
      dropdown.push({ href: "/admin", label: t.common.admin });
    }
  }

  return (
    <header className="site-header sticky top-0 z-40 border-b border-line/70 bg-white/82 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-[4.5rem] items-center gap-7">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label={t.common.siteName}
          >
            <span className="text-lg font-extrabold tracking-[-.04em] text-ink">
              {t.common.siteName}
            </span>
          </Link>

          {/* Desktop: inline dynamic menu */}
          <div className="hidden min-w-0 flex-1 md:block">
            <MenuNav items={menuItems} inline />
          </div>
          <div className="min-w-0 flex-1 md:hidden" />

          <nav className="flex shrink-0 items-center gap-2">
            <Link
              href="/search"
              className="hidden rounded-full p-2 text-ink-soft transition-colors hover:bg-surface-sub md:block"
              aria-label={t.common.search}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Link>
            <div className="hidden md:block">
              <LocaleMenu locale={locale} label={t.common.language} />
            </div>
            {session.userId && session.profile ? (
              <>
                <NotificationBell
                  userId={session.userId}
                  initialCount={unread}
                  label={t.common.notifications}
                />
                <AvatarMenu
                  name={`UID:${session.profile.uid}`}
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
                  className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sub md:block"
                >
                  {t.common.signIn}
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary btn-md hidden rounded-full px-5 md:inline-flex"
                >
                  {t.common.signUp}
                </Link>
              </>
            )}
            {!session.userId && (
              <MobileMenu
                items={menuItems}
                searchLabel={t.common.search}
                signInLabel={t.common.signIn}
                signUpLabel={t.common.signUp}
                menuLabel={t.nav.menu}
              />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
