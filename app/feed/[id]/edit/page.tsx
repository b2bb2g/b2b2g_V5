import { notFound, redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getFeedPost } from "@/lib/data/feed";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";

export default async function EditFeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ t }, session, item] = await Promise.all([
    getT(),
    getSession(),
    getFeedPost(id),
  ]);
  if (!session.userId) redirect(`/login?next=/feed/${id}/edit`);
  if (!item || item.authorId !== session.userId) notFound();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <WorkspacePageHeader title={t.feed.editTitle} description={t.feed.editHint} />
      <FeedComposer
        userId={session.userId}
        uid={session.profile?.uid ?? null}
        avatarPath={session.profile?.avatar_url ?? null}
        postId={item.id}
        initialBody={item.body}
        initialMedia={item.mediaPaths}
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
    </div>
  );
}
