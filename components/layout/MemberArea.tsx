import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { MemberTabs } from "@/components/layout/MemberTabs";
import { BADGE_CODES } from "@/lib/constants";
import type { ReactNode } from "react";

// Shared frame for every member-facing area: role-aware tabs + content.
export async function MemberArea({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const { t } = await getT();

  const items = [
    { href: "/dashboard", label: t.common.dashboard },
    { href: "/dashboard/posts", label: t.nav.myPosts },
    { href: "/write", label: t.dashboard.registerProduct },
    { href: "/dashboard/badges", label: t.dashboard.applyBadge },
    { href: "/inquiries", label: t.inquiry.title },
    { href: "/notifications", label: t.common.notifications },
    { href: "/dashboard/profile", label: t.nav.profile },
  ];
  if (session.badges.some((b) => b.badge_types?.code === BADGE_CODES.CERTIFIED)) {
    items.push({ href: "/dashboard/homepage", label: t.homepage.title });
  }
  if (session.profile.is_coordinator) {
    items.push({ href: "/dashboard/coordinator", label: t.coordinator.title });
  } else if (session.profile.referred_by) {
    items.push({ href: "/dashboard/messages", label: t.coordinator.directMessages });
  }

  return (
    <div className="wide space-y-5">
      <div className="rounded-[1.5rem] bg-ink px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.dashboard.commandCenter}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{t.dashboard.title}</h1>
        <p className="mt-1 max-w-xl text-sm text-white/55">{t.dashboard.commandHint}</p>
      </div>
      <MemberTabs items={items} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
