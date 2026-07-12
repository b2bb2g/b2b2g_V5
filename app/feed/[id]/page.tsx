import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getFeedPost, listFeedComments } from "@/lib/data/feed";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedComments } from "@/components/feed/FeedComments";
import { getFeedCardLabels } from "@/lib/i18n/feed";
import type { Metadata } from "next";
import { postMediaUrl } from "@/lib/media";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getFeedPost(id);
  if (!item) return {};
  const image = item.mediaPaths[0]
    ? postMediaUrl(item.mediaPaths[0])
    : undefined;
  return {
    title: `UID:${item.authorUid} · Member feed`,
    description: item.body.slice(0, 160),
    alternates: { canonical: `/feed/${id}` },
    openGraph: {
      title: `UID:${item.authorUid}`,
      description: item.body.slice(0, 160),
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ t }, session, item, comments] = await Promise.all([
    getT(),
    getSession(),
    getFeedPost(id),
    listFeedComments(id),
  ]);
  if (!item) notFound();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <FeedCard
        item={item}
        viewerId={session.userId}
        returnTo={`/feed/${id}`}
        labels={getFeedCardLabels(t)}
      />
      <FeedComments
        postId={id}
        comments={comments}
        viewerId={session.userId}
        returnTo={`/feed/${id}`}
        labels={{
          title: t.feed.comments,
          placeholder: t.feed.commentPlaceholder,
          submit: t.feed.writeComment,
          signIn: t.feed.signInToComment,
          empty: t.feed.noComments,
          delete: t.feed.deleteComment,
        }}
      />
    </div>
  );
}
