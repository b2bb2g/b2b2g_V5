import Image from "next/image";
import Link from "next/link";
import { postMediaUrl } from "@/lib/media";
import {
  toggleFeedLike,
  deleteFeedPost,
  toggleFeedRepost,
  toggleMemberFollow,
} from "@/app/actions/feed";
import { PendingButton } from "@/components/ui/PendingButton";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { ShareButton } from "@/components/feed/ShareButton";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { FeedPostContent } from "@/components/feed/FeedPostContent";
import {
  CommentIcon,
  GlobeIcon,
  LikeIcon,
  RepostIcon,
} from "@/components/feed/FeedIcons";
import type { FeedItem } from "@/lib/data/feed";
import { FeedSafetyMenu } from "@/components/feed/FeedSafetyMenu";
import { RelativeTime } from "@/components/feed/RelativeTime";
import type { Locale } from "@/lib/constants";

export type FeedLabels = {
  locale: Locale;
  like: string;
  liked: string;
  comment: string;
  comments: string;
  repost: string;
  reposted: string;
  share: string;
  copied: string;
  follow: string;
  following: string;
  memberSubtitle: string;
  publicPost: string;
  justNow: string;
  more: string;
  less: string;
  edit: string;
  delete: string;
  deleteTitle: string;
  deleteBody: string;
  cancel: string;
  safetyMenu: string;
  report: string;
  reportReason: string;
  reportDetails: string;
  reportSpam: string;
  reportMisleading: string;
  reportAbuse: string;
  reportOther: string;
  block: string;
  blockTitle: string;
  blockBody: string;
  openImage: string;
  closeImage: string;
  previousImage: string;
  nextImage: string;
  fullPost: string;
  closePost: string;
  writeComment: string;
  commentPlaceholder: string;
  signInToComment: string;
  noComments: string;
  deleteComment: string;
  loading: string;
  error: string;
  tryAgain: string;
};

export function FeedCard({
  item,
  viewerId,
  returnTo,
  labels,
  compact = false,
  detail = false,
  className = "",
}: {
  item: FeedItem;
  viewerId: string | null;
  returnTo: string;
  compact?: boolean;
  detail?: boolean;
  className?: string;
  labels: FeedLabels;
}) {
  const isOwn = viewerId === item.authorId;
  const sharePath = `/feed/${item.id}`;
  const media = item.mediaPaths;
  const renderedAt = new Date().toISOString();

  return (
    <article
      data-feed-post-id={item.id}
      className={`overflow-hidden rounded-[1.5rem] border border-line/90 bg-white shadow-[0_8px_30px_rgba(25,31,40,.055)] ${compact ? "self-start" : ""} ${className}`}
    >
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
        <Link
          href={`/u/${item.authorUid}`}
          className="flex min-w-0 items-start gap-3"
        >
          {item.avatarPath ? (
            <Image
              src={postMediaUrl(item.avatarPath)}
              alt=""
              width={52}
              height={52}
              className={`${compact ? "h-11 w-11" : "h-13 w-13"} rounded-full border border-line object-cover`}
            />
          ) : (
            <DefaultAvatar className={compact ? "h-11 w-11" : "h-13 w-13"} />
          )}
          <span className="min-w-0 pt-0.5">
            <strong className={`block truncate ${compact ? "text-[15px]" : "text-base"} font-extrabold tracking-[-.01em] text-ink`}>
              UID:{item.authorUid}
            </strong>
            <span className="block truncate text-xs leading-5 text-ink-soft">
              {labels.memberSubtitle}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap text-xs text-ink-faint">
              <RelativeTime
                dateTime={item.createdAt}
                locale={labels.locale}
                initialNow={renderedAt}
                justNowLabel={labels.justNow}
              />
              <span aria-hidden="true">·</span>
              <GlobeIcon className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]" />
              <span className="sr-only">{labels.publicPost}</span>
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {!isOwn &&
            (viewerId ? (
              <form action={toggleMemberFollow}>
                <input type="hidden" name="targetId" value={item.authorId} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <PendingButton className="rounded-full px-3 py-2 text-sm font-extrabold text-primary hover:bg-primary-soft">
                  {item.followingAuthor
                    ? `✓ ${labels.following}`
                    : `＋ ${labels.follow}`}
                </PendingButton>
              </form>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(returnTo)}`}
                className="rounded-full px-3 py-2 text-sm font-extrabold text-primary hover:bg-primary-soft"
              >
                ＋ {labels.follow}
              </Link>
            ))}
          {isOwn && !compact && (
            <div className="flex items-center gap-1">
              <Link
                href={`/feed/${item.id}/edit`}
                className="px-2 py-1 text-xs font-bold text-ink-soft hover:text-primary"
              >
                {labels.edit}
              </Link>
              <form action={deleteFeedPost}>
                <input type="hidden" name="postId" value={item.id} />
                <ConfirmSubmit
                  label={labels.delete}
                  confirmTitle={labels.deleteTitle}
                  confirmBody={labels.deleteBody}
                  confirmLabel={labels.delete}
                  cancelLabel={labels.cancel}
                  className="px-2 py-1 text-xs font-bold text-negative"
                  destructive
                />
              </form>
            </div>
          )}
          {!isOwn && viewerId && !compact && (
            <FeedSafetyMenu
              postId={item.id}
              authorId={item.authorId}
              returnTo={returnTo}
              labels={{
                menu: labels.safetyMenu,
                report: labels.report,
                reportReason: labels.reportReason,
                reportDetails: labels.reportDetails,
                spam: labels.reportSpam,
                misleading: labels.reportMisleading,
                abuse: labels.reportAbuse,
                other: labels.reportOther,
                block: labels.block,
                blockTitle: labels.blockTitle,
                blockBody: labels.blockBody,
                cancel: labels.cancel,
              }}
            />
          )}
        </div>
      </header>

      <FeedPostContent
        postId={item.id}
        body={item.body}
        paths={media}
        authorUid={item.authorUid}
        avatarPath={item.avatarPath}
        createdAt={item.createdAt}
        renderedAt={renderedAt}
        engagement={{
          authorId: item.authorId,
          viewerId,
          returnTo,
          likeCount: item.likeCount,
          likedByViewer: item.likedByViewer,
          commentCount: item.commentCount,
          repostCount: item.repostCount,
          repostedByViewer: item.repostedByViewer,
          shareCount: item.shareCount,
          followingAuthor: item.followingAuthor,
        }}
        compact={compact}
        detail={detail}
        labels={{
          openImage: labels.openImage,
          closeImage: labels.closeImage,
          previousImage: labels.previousImage,
          nextImage: labels.nextImage,
          fullPost: labels.fullPost,
          closePost: labels.closePost,
          more: labels.more,
          less: labels.less,
          publicPost: labels.publicPost,
          locale: labels.locale,
          justNow: labels.justNow,
          like: labels.like,
          liked: labels.liked,
          comment: labels.comment,
          comments: labels.comments,
          repost: labels.repost,
          reposted: labels.reposted,
          share: labels.share,
          copied: labels.copied,
          follow: labels.follow,
          following: labels.following,
          writeComment: labels.writeComment,
          commentPlaceholder: labels.commentPlaceholder,
          signInToComment: labels.signInToComment,
          noComments: labels.noComments,
          deleteComment: labels.deleteComment,
          loading: labels.loading,
          error: labels.error,
          tryAgain: labels.tryAgain,
        }}
      />

      <footer className={`grid grid-cols-4 border-t border-line/70 px-2 py-1.5 text-ink-soft sm:px-3 ${compact ? "mt-auto" : ""}`}>
        {viewerId ? (
          <form action={toggleFeedLike}>
            <input type="hidden" name="postId" value={item.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <PendingButton
              aria-pressed={item.likedByViewer}
              title={item.likedByViewer ? labels.liked : labels.like}
              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-bold transition hover:bg-surface-sub ${item.likedByViewer ? "text-primary" : "text-ink-soft"}`}
            >
              <LikeIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
              {item.likeCount > 0 && <span>{item.likeCount}</span>}
              <span className="sr-only">
                {item.likedByViewer ? labels.liked : labels.like}
              </span>
            </PendingButton>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            title={labels.like}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-bold hover:bg-surface-sub"
          >
            <LikeIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
            {item.likeCount > 0 && <span>{item.likeCount}</span>}
            <span className="sr-only">{labels.like}</span>
          </Link>
        )}
        <Link
          href={`${sharePath}#comments`}
          title={labels.comment}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-bold hover:bg-surface-sub"
        >
          <CommentIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
          {item.commentCount > 0 && <span>{item.commentCount}</span>}
          <span className="sr-only">{labels.comment}</span>
        </Link>
        {viewerId ? (
          <form action={toggleFeedRepost}>
            <input type="hidden" name="postId" value={item.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <PendingButton
              aria-pressed={item.repostedByViewer}
              title={item.repostedByViewer ? labels.reposted : labels.repost}
              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-bold hover:bg-surface-sub ${item.repostedByViewer ? "text-[#238558]" : "text-ink-soft"}`}
            >
              <RepostIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
              {item.repostCount > 0 && <span>{item.repostCount}</span>}
              <span className="sr-only">
                {item.repostedByViewer ? labels.reposted : labels.repost}
              </span>
            </PendingButton>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(sharePath)}`}
            title={labels.repost}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-bold hover:bg-surface-sub"
          >
            <RepostIcon className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]" />
            {item.repostCount > 0 && <span>{item.repostCount}</span>}
            <span className="sr-only">{labels.repost}</span>
          </Link>
        )}
        <ShareButton
          url={sharePath}
          title={item.body.slice(0, 80)}
          label={labels.share}
          copiedLabel={labels.copied}
          postId={item.id}
          viewerId={viewerId}
          returnTo={returnTo}
          count={item.shareCount}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-bold text-ink-soft transition hover:bg-surface-sub hover:text-ink"
        />
      </footer>
    </article>
  );
}
