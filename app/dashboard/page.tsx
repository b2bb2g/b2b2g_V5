import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { BadgeList } from "@/components/ui/Badge";
import { CopyChip } from "@/components/ui/CopyChip";
import { InvitationManager } from "@/components/dashboard/InvitationManager";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import {
  DashboardActionCard,
  DashboardMetricCard,
} from "@/components/dashboard/DashboardCards";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { postMediaUrl } from "@/lib/media";
import {
  BADGE_CODES,
  SUBSCRIPTION_STATUS,
} from "@/lib/constants";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const [{ t, locale }, supabase] = await Promise.all([
    getT(),
    createClient(),
  ]);

  const [
    summaryResult,
    profileContact,
    subscription,
    recentPosts,
    recentInquiries,
    activeInvitations,
    bookmarkCount,
    pushDeviceCount,
  ] = await Promise.all([
    supabase.rpc("member_dashboard_summary"),
    supabase
      .from("profile_contacts")
      .select("email, phone, contact_person")
      .eq("profile_id", session.userId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("expires_at")
      .eq("profile_id", session.userId)
      .eq("status", SUBSCRIPTION_STATUS.ACTIVE)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("id, title_en, title_ko, status, updated_at")
      .eq("author_id", session.userId)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("inquiries")
      .select("id, subject, status, updated_at")
      .or(`sender_id.eq.${session.userId},recipient_id.eq.${session.userId}`)
      .order("updated_at", { ascending: false })
      .limit(4),
    // Owner-scoped reader returns the raw token (active/reserved only, for
    // re-copy), the recipient memo and the accepted member's UID.
    supabase.rpc("get_my_referral_invitations"),
    supabase
      .from("post_bookmarks")
      .select("post_id", { count: "exact", head: true })
      .eq("profile_id", session.userId),
    supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", session.userId),
  ]);

  const summary = (summaryResult.data ?? {}) as {
    posts?: number;
    drafts?: number;
    pending?: number;
    inquiries?: number;
    unread_replies?: number;
    referrals?: number;
    feed_posts?: number;
    followers?: number;
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(value),
    );

  const profile = session.profile;
  const profileBio =
    locale === "ko"
      ? profile.bio_ko || profile.bio || profile.bio_en || ""
      : profile.bio_en || profile.bio || profile.bio_ko || "";
  const completionSignals = [
    !!profile.avatar_url,
    !!profileBio,
    !!profile.company_name,
    !!(
      profileContact.data?.email ||
      profileContact.data?.phone ||
      profileContact.data?.contact_person
    ),
  ];
  const profileCompletion =
    completionSignals.filter(Boolean).length * (100 / completionSignals.length);
  const pendingCount = summary.pending ?? 0;
  const unreadCount = summary.unread_replies ?? 0;
  const hasAttention = pendingCount + unreadCount > 0;
  const recentActivity = [
    ...(recentPosts.data ?? []).map((item) => ({
      ...item,
      href: "/dashboard/posts",
      title: locale === "ko" && item.title_ko ? item.title_ko : item.title_en,
    })),
    ...(recentInquiries.data ?? []).map((item) => ({
      ...item,
      href: `/inquiries/${item.id}`,
      title: item.subject,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 6);

  const roleLinks: { href: string; label: string }[] = [];
  if (
    session.badges.some(
      (badge) => badge.badge_types?.code === BADGE_CODES.CERTIFIED,
    )
  ) {
    roleLinks.push({ href: "/dashboard/homepage", label: t.homepage.title });
  }
  if (profile.is_coordinator) {
    roleLinks.push({
      href: "/dashboard/coordinator",
      label: t.coordinator.title,
    });
  } else if (profile.referred_by) {
    roleLinks.push({
      href: "/dashboard/messages",
      label: t.coordinator.directMessages,
    });
  }

  const onboardingSteps = [
    {
      key: "profile",
      label: t.dashboard.onboardProfile,
      href: "/dashboard/profile/edit",
      done: profileCompletion === 100,
    },
    {
      key: "post",
      label: t.dashboard.onboardPost,
      href: "/write/select",
      done: (summary.posts ?? 0) > 0,
    },
    {
      key: "save",
      label: t.dashboard.onboardSave,
      href: "/commercial",
      done: (bookmarkCount.count ?? 0) > 0,
    },
    {
      key: "alerts",
      label: t.dashboard.onboardAlerts,
      href: "/notifications",
      done: (pushDeviceCount.count ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-7">
      <OnboardingChecklist
        steps={onboardingSteps}
        labels={{
          title: t.dashboard.onboardTitle,
          hint: t.dashboard.onboardHint,
          dismiss: t.common.close,
          progress: t.dashboard.onboardProgress,
        }}
      />
      <section className="overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-(--shadow-card)">
        <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_14rem] xl:items-center">
          <div className="flex min-w-0 items-start gap-4">
            {profile.avatar_url ? (
              <Image
                src={postMediaUrl(profile.avatar_url)}
                alt=""
                width={72}
                height={72}
                priority
                className="h-18 w-18 shrink-0 rounded-full border border-line object-cover"
              />
            ) : (
              <DefaultAvatar className="h-18 w-18" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                {t.dashboard.workspaceOverview}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-extrabold tracking-[-.035em]">
                  UID:{profile.uid}
                </h2>
                <CopyChip
                  value={String(profile.uid)}
                  display=""
                  copyLabel={t.common.copy}
                  copiedLabel={t.common.copied}
                />
                {session.badges.length > 0 && (
                  <BadgeList badges={session.badges} locale={locale} />
                )}
              </div>
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-ink-soft">
                {profileBio || t.profile.publicMemberHint}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`/u/${profile.uid}`} className="btn-primary btn-sm">
                  {t.dashboard.publicProfile}
                </Link>
                <Link
                  href="/dashboard/profile/edit"
                  className="btn-secondary btn-sm"
                >
                  {t.common.edit}
                </Link>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-surface-sub p-4">
            <div className="flex items-end justify-between gap-3">
              <p className="text-xs font-bold text-ink-soft">
                {t.dashboard.profileReadiness}
              </p>
              <strong className="text-xl font-extrabold">
                {profileCompletion}%
              </strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <Link
              href="/dashboard/profile/edit"
              className="mt-3 inline-block text-xs font-bold text-primary"
            >
              {t.dashboard.completeProfile} →
            </Link>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.15em] text-ink-faint">
          {t.dashboard.quickActions}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <DashboardActionCard
            href="/write/select"
            icon="product"
            title={t.dashboard.registerProduct}
            body={t.dashboard.registerProductHint}
            tone="primary"
          />
          <DashboardActionCard
            href="/write?menu=requests"
            icon="request"
            title={t.dashboard.postRequest}
            body={t.dashboard.postRequestHint}
            tone="dark"
          />
          <DashboardActionCard
            href="/feed"
            icon="feed"
            title={t.dashboard.shareUpdate}
            body={t.dashboard.shareUpdateHint}
          />
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.15em] text-ink-faint">
          {t.dashboard.needsAttention}
        </p>
        {hasAttention ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/posts"
              className="group rounded-[1.35rem] border border-caution/20 bg-caution-soft/45 p-5 transition hover:border-caution/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-extrabold text-caution">
                    {pendingCount}
                  </p>
                  <h3 className="mt-2 text-sm font-extrabold">
                    {t.dashboard.pendingPosts}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">
                    {t.dashboard.pendingPostsHint}
                  </p>
                </div>
                <span className="text-caution transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
            <Link
              href="/inquiries"
              className="group rounded-[1.35rem] border border-primary/15 bg-primary-soft/55 p-5 transition hover:border-primary/35"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-extrabold text-primary">
                    {unreadCount}
                  </p>
                  <h3 className="mt-2 text-sm font-extrabold">
                    {t.dashboard.unreadReplies}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">
                    {t.dashboard.unreadRepliesHint}
                  </p>
                </div>
                <span className="text-primary transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[1.15rem] border border-positive/15 bg-positive-soft/55 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-positive text-sm font-extrabold text-white">
              ✓
            </span>
            <div>
              <p className="text-sm font-extrabold text-positive">
                {t.dashboard.allClear}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-ink-soft">
                {t.dashboard.allClearHint}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <DashboardMetricCard
          href="/dashboard/posts"
          icon="posts"
          value={summary.posts ?? 0}
          label={`${t.dashboard.myPostsSummary}${(summary.drafts ?? 0) > 0 ? ` · ${t.post.status.draft} ${summary.drafts}` : ""}`}
        />
        <DashboardMetricCard
          href="/inquiries"
          icon="inquiries"
          value={summary.inquiries ?? 0}
          label={t.dashboard.myInquiriesSummary}
        />
        <DashboardMetricCard
          href="/feed"
          icon="feed"
          value={summary.feed_posts ?? 0}
          label={t.dashboard.feedUpdates}
        />
        <DashboardMetricCard
          href={`/u/${profile.uid}`}
          icon="network"
          value={summary.followers ?? 0}
          label={t.dashboard.networkReach}
        />
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-(--shadow-card)">
        <div className="flex items-end justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-extrabold">
              {t.dashboard.recentActivity}
            </h2>
            <p className="mt-0.5 text-xs text-ink-faint">
              {t.dashboard.recentActivityHint}
            </p>
          </div>
          <div className="flex gap-2 text-xs font-bold">
            <Link href="/dashboard/posts" className="text-primary">
              {t.dashboard.managePosts}
            </Link>
            <span className="text-line">·</span>
            <Link href="/inquiries" className="text-primary">
              {t.dashboard.openInquiries}
            </Link>
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">
            {t.dashboard.noRecentActivity}
          </p>
        ) : (
          <div className="divide-y divide-line">
            {recentActivity.map((item) => (
              <Link
                key={`${item.href}-${item.id}`}
                href={item.href}
                className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-surface-sub/70 sm:px-6"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {item.title}
                </p>
                <StatusLabel
                  status={item.status}
                  label={
                    (t.post.status as Record<string, string>)[item.status] ??
                    (t.inquiry.steps as Record<string, string>)[item.status] ??
                    item.status
                  }
                />
                <time
                  dateTime={item.updated_at}
                  className="hidden text-xs text-ink-faint sm:block"
                >
                  {formatDate(item.updated_at)}
                </time>
                <span className="text-ink-faint transition group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-[1.5rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-primary">
            {t.dashboard.trustStatus}
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-extrabold">{t.dashboard.myBadges}</h2>
              <div className="mt-2">
                {session.badges.length ? (
                  <BadgeList badges={session.badges} locale={locale} />
                ) : (
                  <p className="text-sm text-ink-faint">
                    {t.dashboard.noBadges}
                  </p>
                )}
              </div>
              <Link
                href="/dashboard/badges"
                className="mt-4 inline-block text-sm font-bold text-primary"
              >
                {t.dashboard.applyBadge} →
              </Link>
            </div>
            <div className="border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <h2 className="text-sm font-extrabold">
                {t.dashboard.subscription}
              </h2>
              {subscription.data ? (
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  <span className="font-bold text-positive">
                    {t.dashboard.subActive}
                  </span>
                  <br />
                  {t.dashboard.subExpiresOn}{" "}
                  {formatDate(subscription.data.expires_at)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-ink-faint">
                  {t.dashboard.subNone}
                </p>
              )}
              <Link
                href="/membership"
                className="mt-4 inline-block text-sm font-bold text-primary"
              >
                {t.dashboard.subCta} →
              </Link>
            </div>
          </div>
        </section>

        <InvitationManager
          locale={locale}
          invitations={(
            (activeInvitations.data ?? []) as Array<{
              id: string;
              label: string | null;
              status: string;
              token: string | null;
              expires_at: string;
              created_at: string;
              used_at: string | null;
              used_uid: number | null;
            }>
          ).map((row) => ({
            id: row.id,
            label: row.label,
            status: row.status,
            // The token is present only for active/reserved links; build the
            // shareable short link so the raw token stays server-derived.
            link: row.token
              ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/i/${row.token}`
              : null,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            usedAt: row.used_at,
            usedUid: row.used_uid,
          }))}
          labels={{
            eyebrow: t.dashboard.growthTools,
            title: t.dashboard.referralLink,
            description: t.dashboard.referralHint,
            infoLabel: t.dashboard.referralInfoLabel,
            infoOneUse: t.dashboard.referralInfoOneUse,
            infoExpires: t.dashboard.referralInfoExpires,
            infoRecopy: t.dashboard.referralInfoRecopy,
            recipient: t.dashboard.invitationRecipient,
            recipientPlaceholder: t.dashboard.invitationRecipientPlaceholder,
            create: t.dashboard.createInvitation,
            generated: t.dashboard.invitationGenerated,
            copy: t.common.copy,
            copied: t.common.copied,
            qr: t.dashboard.qr,
            expires: t.dashboard.invitationExpires,
            noLabel: t.dashboard.invitationNoLabel,
            statusWaiting: t.dashboard.invitationStatusWaiting,
            statusSigningUp: t.dashboard.invitationStatusSigningUp,
            statusJoined: t.dashboard.invitationStatusJoined,
            statusExpired: t.dashboard.invitationStatusExpired,
            statusRevoked: t.dashboard.invitationStatusRevoked,
            revoke: t.dashboard.revokeInvitation,
            empty: t.dashboard.noActiveInvitations,
            activeLimit: t.dashboard.invitationLimitReached,
            error: t.dashboard.invitationCreateFailed,
          }}
        />
      </div>

      {roleLinks.length > 0 && (
        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.15em] text-ink-faint">
            {t.dashboard.roleShortcuts}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {roleLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-[1.25rem] border border-line bg-white px-5 py-4 text-sm font-extrabold shadow-[0_8px_24px_rgba(25,31,40,.045)] transition hover:border-primary/35"
              >
                {item.label}
                <span className="text-primary transition group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
