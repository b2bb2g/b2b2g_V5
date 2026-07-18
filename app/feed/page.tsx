import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getMemberNetworkStats, listFeed } from "@/lib/data/feed";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { FeedStream } from "@/components/feed/FeedStream";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFeedCardLabels } from "@/lib/i18n/feed";
import { FeedNetworkSidebar } from "@/components/feed/FeedNetworkSidebar";

export const metadata = {
  title: "B2BB2G Network",
  description:
    "Connect through public updates from B2BB2G marketplace members.",
  alternates: { canonical: "/feed" },
};

export default async function FeedPage() {
  const [{ t, locale }, session, items] = await Promise.all([
    getT(),
    getSession(),
    listFeed({ limit: 12 }),
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
    <div className="wide grid min-w-0 items-start justify-center gap-6 lg:grid-cols-[minmax(0,46rem)_20rem]">
      <div className="min-w-0 space-y-5">
        <PageHeader title={t.feed.title} subtitle={t.feed.subtitle} />
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
        {items.length > 0 ? (
          <FeedStream
            initialItems={items}
            viewerId={session.userId}
            returnTo="/feed"
            labels={labels}
          />
        ) : (
          <EmptyState title={t.feed.empty} hint={t.feed.emptyHint} />
        )}
      </div>
      <FeedNetworkSidebar profile={profile} stats={stats} bio={bio} t={t} />
    </div>
  );
}
