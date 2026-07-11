import Image from "next/image";
import Link from "next/link";
import { createFeedComment, deleteFeedComment } from "@/app/actions/feed";
import { PendingButton } from "@/components/ui/PendingButton";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { postMediaUrl } from "@/lib/media";
import type { FeedComment } from "@/lib/data/feed";

export function FeedComments({
  postId,
  comments,
  viewerId,
  returnTo,
  labels,
}: {
  postId: string;
  comments: FeedComment[];
  viewerId: string | null;
  returnTo: string;
  labels: {
    title: string;
    placeholder: string;
    submit: string;
    signIn: string;
    empty: string;
    delete: string;
  };
}) {
  return (
    <section
      id="comments"
      className="scroll-mt-24 rounded-[1.35rem] border border-line/90 bg-white p-5 shadow-[0_8px_30px_rgba(25,31,40,.055)] sm:p-6"
    >
      <h2 className="text-lg font-extrabold">
        {labels.title} {comments.length > 0 ? comments.length : ""}
      </h2>

      {viewerId ? (
        <form action={createFeedComment} className="mt-4 flex items-end gap-2">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <textarea
            name="body"
            required
            maxLength={800}
            rows={2}
            placeholder={labels.placeholder}
            className="min-h-12 flex-1 resize-y rounded-2xl border border-line bg-surface-sub px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
          <PendingButton className="btn-primary btn-md shrink-0">
            {labels.submit}
          </PendingButton>
        </form>
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(returnTo)}`}
          className="mt-4 block rounded-2xl bg-surface-sub px-4 py-3 text-center text-sm font-bold text-primary"
        >
          {labels.signIn}
        </Link>
      )}

      {comments.length > 0 ? (
        <div className="mt-6 space-y-5">
          {comments.map((comment) => (
            <article key={comment.id} className="flex items-start gap-3">
              <Link href={`/u/${comment.authorUid}`} className="shrink-0">
                {comment.avatarPath ? (
                  <Image
                    src={postMediaUrl(comment.avatarPath)}
                    alt=""
                    width={38}
                    height={38}
                    className="h-9.5 w-9.5 rounded-full border border-line object-cover"
                  />
                ) : (
                  <DefaultAvatar className="h-9.5 w-9.5" />
                )}
              </Link>
              <div className="min-w-0 flex-1 rounded-2xl bg-surface-sub px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/u/${comment.authorUid}`}
                      className="text-sm font-extrabold hover:text-primary"
                    >
                      UID:{comment.authorUid}
                    </Link>
                    <time
                      dateTime={comment.createdAt}
                      className="ml-2 text-xs text-ink-faint"
                    >
                      {comment.createdAt.slice(0, 10)}
                    </time>
                  </div>
                  {viewerId === comment.authorId && (
                    <form action={deleteFeedComment}>
                      <input
                        type="hidden"
                        name="commentId"
                        value={comment.id}
                      />
                      <input type="hidden" name="postId" value={postId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <PendingButton
                        className="text-xs font-bold text-ink-faint hover:text-negative"
                        aria-label={labels.delete}
                      >
                        ×
                      </PendingButton>
                    </form>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-soft">
                  {comment.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-ink-faint">
          {labels.empty}
        </p>
      )}
    </section>
  );
}
