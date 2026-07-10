import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import { BadgeList } from "@/components/ui/Badge";
import { CopyField } from "@/components/ui/CopyField";
import { signOut } from "@/app/actions/auth";
import {
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">{t.dashboard.title}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {session.profile.display_name} · {t.admin.uid} {session.profile.uid}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-faint hover:bg-surface-sub"
          >
            {t.common.signOut}
          </button>
        </form>
      </header>

      <section className="rounded-card border border-line p-4">
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

      <section className="rounded-card border border-line p-4">
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

      <section className="rounded-card border border-line p-4">
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
      </section>

      <div className="grid grid-cols-2 gap-3">
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
      </div>
    </div>
  );
}
