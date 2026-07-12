import type { Dictionary } from "@/lib/i18n";
import type { FeedLabels } from "@/components/feed/FeedCard";

export function getFeedCardLabels(t: Dictionary): FeedLabels {
  return {
    like: t.feed.like,
    liked: t.feed.liked,
    comment: t.feed.comment,
    comments: t.feed.comments,
    repost: t.feed.repost,
    reposted: t.feed.reposted,
    share: t.feed.share,
    copied: t.common.copied,
    follow: t.feed.follow,
    following: t.feed.following,
    memberSubtitle: t.feed.memberSubtitle,
    publicPost: t.feed.publicPost,
    more: t.feed.more,
    less: t.feed.less,
    edit: t.common.edit,
    delete: t.common.delete,
    deleteTitle: t.feed.deleteTitle,
    deleteBody: t.feed.deleteBody,
    cancel: t.common.cancel,
    safetyMenu: t.feed.safetyMenu,
    report: t.feed.report,
    reportReason: t.feed.reportReason,
    reportDetails: t.feed.reportDetails,
    reportSpam: t.feed.reportSpam,
    reportMisleading: t.feed.reportMisleading,
    reportAbuse: t.feed.reportAbuse,
    reportOther: t.feed.reportOther,
    block: t.feed.block,
    blockTitle: t.feed.blockTitle,
    blockBody: t.feed.blockBody,
  };
}
