import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { PendingButton } from "@/components/ui/PendingButton";
import {
  reviewFeedCommentReport,
  reviewFeedReport,
} from "@/app/actions/admin/feed";

export default async function FeedSafetyPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: commentReports } = await supabase
    .from("member_feed_comment_reports")
    .select(
      "id, comment_id, reporter_id, reason, created_at, member_feed_comments!inner(id, body, post_id, author_id, profiles!member_feed_comments_author_id_fkey(uid))",
    )
    .eq("status", "pending")
    .order("created_at")
    .limit(50);
  const { data: reports } = await supabase
    .from("member_feed_reports")
    .select("id, post_id, reporter_id, reason, details, created_at")
    .eq("status", "pending")
    .order("created_at")
    .limit(50);
  const postIds = [...new Set((reports ?? []).map((item) => item.post_id))];
  const reporterIds = [
    ...new Set((reports ?? []).map((item) => item.reporter_id)),
  ];
  const [{ data: posts }, { data: reporters }] = await Promise.all([
    postIds.length
      ? supabase
          .from("member_feed_posts")
          .select(
            "id, body, author_id, profiles!member_feed_posts_author_id_fkey(uid)",
          )
          .in("id", postIds)
      : Promise.resolve({ data: [] }),
    reporterIds.length
      ? supabase.from("profiles").select("id, uid").in("id", reporterIds)
      : Promise.resolve({ data: [] }),
  ]);
  const postById = new Map((posts ?? []).map((item) => [item.id, item]));
  const reporterById = new Map(
    (reporters ?? []).map((item) => [item.id, item.uid]),
  );

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-extrabold">{t.admin.feedSafety}</h2>
        <p className="mt-1 text-xs text-ink-faint">
          {t.admin.pendingReports}: {reports?.length ?? 0}
        </p>
      </div>
      {(commentReports ?? []).map((report) => {
        const comment = report.member_feed_comments as unknown as {
          id: string;
          body: string;
          post_id: string;
          profiles: { uid: number } | null;
        };
        return (
          <article
            key={report.id}
            className="rounded-[1.25rem] border border-line bg-white p-5 shadow-(--shadow-card)"
          >
            <p className="text-xs font-bold uppercase tracking-[.12em] text-caution">
              {t.admin.commentReports} · {report.reason}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
              {comment?.body ?? "—"}
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              Author UID:{comment?.profiles?.uid ?? "—"} ·{" "}
              {report.created_at.slice(0, 10)}
            </p>
            <form action={reviewFeedCommentReport} className="mt-4 flex gap-2">
              <input type="hidden" name="reportId" value={report.id} />
              <input type="hidden" name="commentId" value={report.comment_id} />
              <PendingButton
                name="decision"
                value="delete"
                className="flex-1 rounded-xl bg-negative px-3 py-2.5 text-xs font-bold text-white"
              >
                {t.feed.deleteComment}
              </PendingButton>
              <PendingButton
                name="decision"
                value="dismiss"
                className="flex-1 rounded-xl bg-surface-sub px-3 py-2.5 text-xs font-bold text-ink-soft"
              >
                {t.admin.dismissReport}
              </PendingButton>
            </form>
          </article>
        );
      })}
      {!reports?.length && !commentReports?.length ? (
        <EmptyState title={t.admin.noPending} />
      ) : (
        (reports ?? []).map((report) => {
          const post = postById.get(report.post_id);
          const author = post?.profiles as unknown as { uid: number } | null;
          return (
            <article
              key={report.id}
              className="rounded-[1.25rem] border border-line bg-white p-5 shadow-(--shadow-card)"
            >
              <p className="text-xs font-bold uppercase tracking-[.12em] text-negative">
                {report.reason}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
                {post?.body ?? "—"}
              </p>
              <p className="mt-2 text-xs text-ink-faint">
                Author UID:{author?.uid ?? "—"} · Reporter UID:
                {reporterById.get(report.reporter_id) ?? "—"} ·{" "}
                {report.created_at.slice(0, 10)}
              </p>
              {report.details && (
                <p className="mt-3 rounded-xl bg-surface-sub px-3 py-2 text-xs text-ink-soft">
                  {report.details}
                </p>
              )}
              <form action={reviewFeedReport} className="mt-4 flex gap-2">
                <input type="hidden" name="reportId" value={report.id} />
                <input type="hidden" name="postId" value={report.post_id} />
                <PendingButton
                  name="decision"
                  value="hide"
                  className="flex-1 rounded-xl bg-negative px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.hideFeedPost}
                </PendingButton>
                <PendingButton
                  name="decision"
                  value="dismiss"
                  className="flex-1 rounded-xl bg-surface-sub px-3 py-2.5 text-xs font-bold text-ink-soft"
                >
                  {t.admin.dismissReport}
                </PendingButton>
              </form>
            </article>
          );
        })
      )}
    </div>
  );
}
