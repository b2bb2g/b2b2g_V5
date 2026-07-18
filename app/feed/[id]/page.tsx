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
  const [{ t, locale }, session, item, comments] = await Promise.all([
    getT(),
    getSession(),
    getFeedPost(id),
    listFeedComments(id),
  ]);
  if (!item) notFound();
  const renderedAt = new Date().toISOString();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <FeedCard
        item={item}
        viewerId={session.userId}
        returnTo={`/feed/${id}`}
        detail
        labels={getFeedCardLabels(t, locale)}
      />
      <FeedComments
        postId={id}
        comments={comments}
        viewerId={session.userId}
        returnTo={`/feed/${id}`}
        locale={locale}
        renderedAt={renderedAt}
        labels={{
          title: t.feed.comments,
          comments: t.feed.comments,
          placeholder: t.feed.commentPlaceholder,
          submit: t.feed.writeComment,
          signIn: t.feed.signInToComment,
          empty: t.feed.noComments,
          delete: t.feed.deleteComment,
          justNow: t.feed.justNow,
          like: t.feed.like,
          reply: t.feed.reply,
          moreReplies: t.feed.moreReplies,
          close: t.common.close,
          cancel: t.common.cancel,
          addImage: t.feed.addPhotos,
          addEmoji: t.feed.addEmoji,
          removeImage: t.feed.removeImage,
          uploadError: t.feed.uploadError,
          likedBy: t.feed.likedBy,
          viewedBy: t.feed.viewedBy,
          views: t.feed.views,
        }}
      />
    </div>
  );
}
