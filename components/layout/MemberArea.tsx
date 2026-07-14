import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { MemberTabs } from "@/components/layout/MemberTabs";
import { MemberHero } from "@/components/layout/MemberHero";
import { BADGE_CODES, POST_STATUS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { postMediaUrl } from "@/lib/media";
import type { ReactNode } from "react";

// Shared frame for every member-facing area: role-aware tabs + content.
export async function MemberArea({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const [pendingPosts, unreadMessages, unreadNotifications] = await Promise.all(
    [
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", session.userId)
        .eq("status", POST_STATUS.PENDING),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", session.userId)
        .eq("state", "unread")
        .eq("type", "message_delivered"),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", session.userId)
        .eq("state", "unread"),
    ],
  );

  const items = [
    { href: "/dashboard", label: t.common.dashboard },
    {
      href: "/dashboard/posts",
      label: t.nav.myPosts,
      count: pendingPosts.count ?? 0,
      countLabel: t.nav.badgeInReview,
    },
    { href: "/write/select", label: t.dashboard.registerProduct },
    { href: "/dashboard/badges", label: t.dashboard.applyBadge },
    {
      href: "/inquiries",
      label: t.inquiry.title,
      count: unreadMessages.count ?? 0,
      countLabel: t.nav.badgeUnread,
    },
    {
      href: "/notifications",
      label: t.common.notifications,
      count: unreadNotifications.count ?? 0,
      countLabel: t.nav.badgeUnread,
    },
    { href: "/dashboard/profile", label: t.nav.profile },
    { href: "/dashboard/security", label: t.nav.security },
  ];
  if (
    session.badges.some((b) => b.badge_types?.code === BADGE_CODES.CERTIFIED)
  ) {
    items.push({ href: "/dashboard/homepage", label: t.homepage.title });
  }
  if (session.profile.is_coordinator) {
    items.push({ href: "/dashboard/coordinator", label: t.coordinator.title });
  } else if (session.profile.referred_by) {
    items.push({
      href: "/dashboard/messages",
      label: t.coordinator.directMessages,
    });
  }

  return (
    <div className="wide space-y-4">
      <MemberHero
        uid={session.profile.uid}
        avatarSrc={
          session.profile.avatar_url
            ? postMediaUrl(session.profile.avatar_url)
            : null
        }
        eyebrow={t.dashboard.commandCenter}
        title={t.dashboard.title}
        hint={t.dashboard.commandHint}
      />
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <MemberTabs items={items} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
