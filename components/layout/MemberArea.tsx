import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { MemberTabs } from "@/components/layout/MemberTabs";
import { BADGE_CODES, POST_STATUS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { postMediaUrl } from "@/lib/media";
import Image from "next/image";
import Link from "next/link";
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
    },
    { href: "/write", label: t.dashboard.registerProduct },
    { href: "/dashboard/badges", label: t.dashboard.applyBadge },
    {
      href: "/inquiries",
      label: t.inquiry.title,
      count: unreadMessages.count ?? 0,
    },
    {
      href: "/notifications",
      label: t.common.notifications,
      count: unreadNotifications.count ?? 0,
    },
    { href: "/dashboard/profile", label: t.nav.profile },
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
      <div className="relative overflow-hidden rounded-[1.5rem] bg-[#101923] px-5 py-5 text-white shadow-[0_16px_48px_rgba(16,25,35,.14)] sm:px-7 sm:py-6">
        <span
          className="absolute -right-20 -top-28 h-64 w-64 rounded-full border-[44px] border-primary/15"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#79b4ff]">
              {t.dashboard.commandCenter}
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-[-.04em] sm:text-3xl">
              {t.dashboard.title}
            </h1>
            <p className="mt-1 hidden max-w-xl text-xs leading-5 text-white/55 sm:block">
              {t.dashboard.commandHint}
            </p>
          </div>
          <Link
            href={`/u/${session.profile.uid}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/8 p-1.5 pr-3 transition hover:bg-white/12"
          >
            {session.profile.avatar_url ? (
              <Image
                src={postMediaUrl(session.profile.avatar_url)}
                alt=""
                width={38}
                height={38}
                className="h-9.5 w-9.5 rounded-full object-cover"
              />
            ) : (
              <DefaultAvatar className="h-9.5 w-9.5" />
            )}
            <span className="hidden text-xs font-extrabold sm:block">
              UID:{session.profile.uid}
            </span>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <MemberTabs items={items} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
