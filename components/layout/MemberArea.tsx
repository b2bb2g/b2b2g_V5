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
      <MemberTabs items={items} />
      {children}
    </div>
  );
}
