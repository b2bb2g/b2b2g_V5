import Link from "next/link";
import { CommentComposer } from "@/components/feed/CommentComposer";
import { CommentList, type CommentListLabels } from "@/components/feed/CommentList";
import { FeedInsights } from "@/components/feed/FeedInsights";
import type { FeedComment } from "@/lib/data/feed";
import type { Locale } from "@/lib/constants";

export function FeedComments({
  postId,
  comments,
  viewerId,
  returnTo,
  locale,
  renderedAt,
  labels,
}: {
  postId: string;
  comments: FeedComment[];
  viewerId: string | null;
  returnTo: string;
  locale: Locale;
  renderedAt: string;
  labels: CommentListLabels & {
    title: string;
    signIn: string;
    empty: string;
    likedBy: string;
    viewedBy: string;
    views: string;
  };
}) {
  const topLevelCount = comments.filter((comment) => !comment.parentId).length;
  return (
    <section
      id="comments"
      className="scroll-mt-24 rounded-[1.35rem] border border-line/90 bg-white p-5 shadow-[0_8px_30px_rgba(25,31,40,.055)] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">
          {labels.title} {topLevelCount > 0 ? topLevelCount : ""}
        </h2>
        <FeedInsights
          postId={postId}
          signedIn={!!viewerId}
          labels={{
            likedBy: labels.likedBy,
            viewedBy: labels.viewedBy,
            views: labels.views,
            close: labels.close,
          }}
        />
      </div>

      {viewerId ? (
        <div className="mt-4">
          <CommentComposer
            postId={postId}
            returnTo={returnTo}
            userId={viewerId}
            labels={{
              placeholder: labels.placeholder,
              submit: labels.submit,
              addImage: labels.addImage,
              addEmoji: labels.addEmoji,
              removeImage: labels.removeImage,
              uploadError: labels.uploadError,
            }}
          />
        </div>
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(returnTo)}`}
          className="mt-4 block rounded-2xl bg-surface-sub px-4 py-3 text-center text-sm font-bold text-primary"
        >
          {labels.signIn}
        </Link>
      )}

      {comments.length > 0 ? (
        <div className="mt-6">
          <CommentList
            postId={postId}
            comments={comments}
            viewerId={viewerId}
            returnTo={returnTo}
            locale={locale}
            renderedAt={renderedAt}
            labels={labels}
          />
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-ink-faint">
          {labels.empty}
        </p>
      )}
    </section>
  );
}
