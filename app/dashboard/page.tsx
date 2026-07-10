import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import Image from "next/image";
import { BadgeList } from "@/components/ui/Badge";
import { CopyField } from "@/components/ui/CopyField";
import { CopyChip } from "@/components/ui/CopyChip";
import { postMediaUrl } from "@/lib/media";
import { signOut } from "@/app/actions/auth";
import {
  BADGE_CODES,
  POST_STATUS,
  SETTING_KEYS,
  SUBSCRIPTION_STATUS,
} from "@/lib/constants";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const [{ t, locale }, settings, supabase] = await Promise.all([
    getT(),
    getPublicSettings(),
    createClient(),
  ]);

  const [postsCount, inquiriesCount, subscription, referralCount] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", session.userId)
        .neq("status", POST_STATUS.DRAFT),
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .or(`sender_id.eq.${session.userId},recipient_id.eq.${session.userId}`),
      supabase
        .from("subscriptions")
        .select("expires_at")
        .eq("profile_id", session.userId)
        .eq("status", SUBSCRIPTION_STATUS.ACTIVE)
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", session.userId),
    ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const referralLink = `${siteUrl}/signup?ref=${session.profile.uid}`;
  const showReferralStats = settingBool(
    settings,
    SETTING_KEYS.REFERRAL_STATS_VISIBLE,
    false
  );

  return (
    <div className="space-y-5">
      {/* Identity header: same card grammar as the profile screen */}
      <header className="card flex flex-wrap items-center gap-4 p-5">
        {session.profile.avatar_url ? (
          <Image
            src={postMediaUrl(session.profile.avatar_url)}
            alt={session.profile.display_name ?? ""}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-extrabold text-primary-strong">
            {(session.profile.display_name ?? "U").slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">
            {session.profile.display_name ?? session.profile.company_name}
          </p>
          <CopyChip
            value={String(session.profile.uid)}
            display={`${t.profile.memberId} ${session.profile.uid}`}
            copyLabel={t.common.copy}
            copiedLabel={t.common.copied}
          />
          {session.badges.length > 0 && (
            <div className="mt-1">
              <BadgeList badges={session.badges} locale={locale} />
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link href="/dashboard/profile" className="btn-secondary btn-sm">
            {t.nav.profile}
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-faint transition-colors hover:bg-surface-sub"
            >
              {t.common.signOut}
            </button>
          </form>
        </div>
      </header>

      {/* Primary actions: register or request (UX convention: clear entry points) */}
      <div className="flex flex-wrap gap-2">
        <Link href="/write/select" className="btn-primary btn-lg">
          {t.dashboard.registerProduct}
        </Link>
        <Link href="/write?menu=requests" className="btn-soft btn-lg">
          {t.dashboard.postRequest}
        </Link>
      </div>

      {/* Status cards: three across on the wide frame */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card h-full p-4">
          <h2 className="text-sm font-bold">{t.dashboard.referralLink}</h2>
          <p className="mt-0.5 text-xs text-ink-faint">{t.dashboard.referralHint}</p>
          <div className="mt-3">
            <CopyField
              value={referralLink}
              copyLabel={t.common.copy}
              copiedLabel={t.common.copied}
            />
          </div>
          {showReferralStats && (
            <p className="mt-3 text-sm text-ink-soft">
              {t.dashboard.referralCount}:{" "}
              <span className="font-bold text-ink">{referralCount.count ?? 0}</span>
            </p>
          )}
        </section>

        <section className="card h-full p-4">
          <h2 className="text-sm font-bold">{t.dashboard.myBadges}</h2>
          <div className="mt-2">
            {session.badges.length ? (
              <BadgeList badges={session.badges} locale={locale} />
            ) : (
              <p className="text-sm text-ink-faint">{t.dashboard.noBadges}</p>
            )}
          </div>
          <Link
            href="/dashboard/badges"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            {t.dashboard.applyBadge}
          </Link>
        </section>

        <section className="card h-full p-4">
          <h2 className="text-sm font-bold">{t.dashboard.subscription}</h2>
          {subscription.data ? (
            <p className="mt-2 text-sm text-ink-soft">
              <span className="font-semibold text-positive">{t.dashboard.subActive}</span>
              {" · "}
              {t.dashboard.subExpiresOn}{" "}
              {new Date(subscription.data.expires_at).toISOString().slice(0, 10)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-faint">{t.dashboard.subNone}</p>
          )}
          <Link
            href="/membership"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            {t.dashboard.subCta}
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link
          href="/dashboard/posts"
          className="rounded-card border border-line p-4 hover:border-primary"
        >
          <p className="text-2xl font-extrabold">{postsCount.count ?? 0}</p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {t.dashboard.myPostsSummary}
          </p>
        </Link>
        <Link
          href="/inquiries"
          className="rounded-card border border-line p-4 hover:border-primary"
        >
          <p className="text-2xl font-extrabold">{inquiriesCount.count ?? 0}</p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {t.dashboard.myInquiriesSummary}
          </p>
        </Link>
        {session.badges.some((b) => b.badge_types?.code === BADGE_CODES.CERTIFIED) && (
          <Link
            href="/dashboard/homepage"
            className="rounded-card border border-line p-4 hover:border-primary"
          >
            <p className="text-sm font-bold">{t.homepage.title}</p>
          </Link>
        )}
        {session.profile.is_coordinator && (
          <Link
            href="/dashboard/coordinator"
            className="rounded-card border border-line p-4 hover:border-primary"
          >
            <p className="text-sm font-bold">{t.coordinator.title}</p>
          </Link>
        )}
        {session.profile.referred_by && !session.profile.is_coordinator && (
          <Link
            href="/dashboard/messages"
            className="rounded-card border border-line p-4 hover:border-primary"
          >
            <p className="text-sm font-bold">{t.coordinator.directMessages}</p>
          </Link>
        )}
      </div>
    </div>
  );
}
