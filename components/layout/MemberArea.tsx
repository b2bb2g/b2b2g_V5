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
    <div className="wide space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#101923] px-6 py-8 text-white shadow-[0_22px_70px_rgba(16,25,35,.16)] sm:px-9 sm:py-10">
        <span
          className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/35 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {t.dashboard.commandCenter}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">
            {t.dashboard.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
            {t.dashboard.commandHint}
          </p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <MemberTabs items={items} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
