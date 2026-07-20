import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import {
  getMemberNetworkStats,
  listFeed,
  sanitizeFeedTag,
} from "@/lib/data/feed";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { FeedStream } from "@/components/feed/FeedStream";
import { BoardSectionHeading } from "@/components/marketplace/BoardSectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFeedCardLabels } from "@/lib/i18n/feed";
import { FeedNetworkSidebar } from "@/components/feed/FeedNetworkSidebar";

export async function generateMetadata(props: {
  searchParams: Promise<{ tab?: string; tag?: string }>;
}) {
  const { tab, tag: rawTag } = await props.searchParams;
  const tag = sanitizeFeedTag(rawTag);
  if (tag) {
    return {
      title: `#${tag} · B2BB2G Network`,
      description: `Member updates tagged #${tag} on the B2BB2G network.`,
      alternates: { canonical: `/feed?tag=${encodeURIComponent(tag)}` },
    };
  }
  return {
    title: "B2BB2G Network",
    description:
      "Connect through public updates from B2BB2G marketplace members.",
    alternates: { canonical: "/feed" },
    // The following tab is personalized; keep crawlers on the public feed.
    ...(tab === "following" ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function FeedPage(props: {
  searchParams: Promise<{ tab?: string; tag?: string }>;
}) {
  const { tab, tag: rawTag } = await props.searchParams;
  const followingOnly = tab === "following";
  const tag = sanitizeFeedTag(rawTag);
  const [{ t, locale }, session, items] = await Promise.all([
    getT(),
    getSession(),
    listFeed({ limit: 12, followingOnly, tag }),
  ]);
  const stats = await getMemberNetworkStats(session.userId);
  const profile = session.profile;
  const bio = profile
    ? locale === "ko"
      ? profile.bio_ko || profile.bio || profile.bio_en || ""
      : profile.bio_en || profile.bio || profile.bio_ko || ""
    : "";
  const labels = getFeedCardLabels(t, locale);

  return (
    <div className="full-bleed bg-[#f5f5f7]">
      {/* Header and the two-column feed share one centered column, so the
          social content sits in the middle of the page (not pushed left). */}
      <div className="mx-auto w-full max-w-[68rem] px-4 pb-16 pt-9 sm:px-6 sm:pb-20 sm:pt-12 lg:pt-14">
        <BoardSectionHeading
          eyebrow={t.feed.eyebrow}
          title={t.feed.title}
          body={t.feed.subtitle}
          level="h1"
        />
        <div className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,46rem)_20rem]">
          <div className="min-w-0 space-y-5">
        {session.userId ? (
          <FeedComposer
            userId={session.userId}
            uid={session.profile?.uid ?? null}
            avatarPath={session.profile?.avatar_url ?? null}
            labels={{
              placeholder: t.feed.placeholder,
              addPhotos: t.feed.addPhotos,
              publishing: t.feed.publishing,
              publish: t.feed.publish,
              save: t.common.save,
              remove: t.common.remove,
              uploadError: t.feed.uploadError,
              moveEarlier: t.feed.moveEarlier,
              moveLater: t.feed.moveLater,
            }}
          />
        ) : (
          <div className="rounded-[1.5rem] border border-line bg-white p-5 text-center shadow-(--shadow-card)">
            <p className="text-sm font-bold">{t.feed.joinPrompt}</p>
            <Link href="/login?next=/feed" className="btn-primary btn-md mt-4">
              {t.common.signIn}
            </Link>
          </div>
        )}
        {session.userId && (
          <nav
            className="flex w-fit gap-1 rounded-full bg-surface-sub p-1"
            aria-label={t.feed.title}
          >
            {[
              { href: "/feed", label: t.feed.tabAll, active: !followingOnly },
              {
                href: "/feed?tab=following",
                label: t.feed.tabFollowing,
                active: followingOnly,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  item.active
                    ? "bg-[#101923] text-white shadow-sm"
                    : "text-ink-soft hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        {tag && (
          <p className="flex items-center gap-2">
            <span className="inline-flex min-h-9 items-center rounded-full bg-primary-soft px-4 text-sm font-extrabold text-primary-strong">
              #{tag}
            </span>
            <Link
              href={followingOnly ? "/feed?tab=following" : "/feed"}
              className="text-xs font-bold text-ink-soft hover:text-ink"
            >
              {t.common.clearFilter}
            </Link>
          </p>
        )}
        {items.length > 0 ? (
          <FeedStream
            key={`${followingOnly ? "following" : "all"}:${tag}`}
            initialItems={items}
            viewerId={session.userId}
            returnTo={
              tag
                ? `/feed?tag=${encodeURIComponent(tag)}`
                : followingOnly
                  ? "/feed?tab=following"
                  : "/feed"
            }
            labels={labels}
            followingOnly={followingOnly}
            tag={tag}
          />
        ) : followingOnly ? (
          <EmptyState
            title={t.feed.followingEmpty}
            hint={t.feed.followingEmptyHint}
          />
        ) : (
          <EmptyState title={t.feed.empty} hint={t.feed.emptyHint} />
        )}
          </div>
          <FeedNetworkSidebar profile={profile} stats={stats} bio={bio} t={t} />
        </div>
      </div>
    </div>
  );
}
