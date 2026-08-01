import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { closeOwnPost, deleteOwnPost } from "@/app/actions/posts";
import { BOARD_TYPES, POST_STATUS } from "@/lib/constants";

// Author toolbar on the public detail page: the same manage actions as the
// "my posts" workspace (edit / close / delete), so an author who lands on
// their own post never has to detour through the dashboard. Replaces the old
// status-only banner — the status (and a rejection reason) now live here.
export async function OwnerPostControls({
  postId,
  menuSlug,
  status,
  type,
  rejectReason,
}: {
  postId: string;
  menuSlug: string;
  status: string;
  type: string;
  rejectReason: string | null;
}) {
  const { t } = await getT();

  return (
    <section
      aria-label={t.post.ownerBarTitle}
      className="rounded-[1.25rem] border border-line bg-white px-4 py-3 shadow-(--shadow-card)"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <p className="whitespace-nowrap text-xs font-bold uppercase tracking-[.14em] text-ink-faint">
            {t.post.ownerBarTitle}
          </p>
          <StatusLabel
            status={status}
            label={
              t.post.status[status as keyof typeof t.post.status] ?? status
            }
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/write?menu=${menuSlug}&post=${postId}`}
            className="btn-secondary btn-sm"
          >
            {t.common.edit}
          </Link>
          {type === BOARD_TYPES.REQUEST && status === POST_STATUS.APPROVED && (
            <form action={closeOwnPost}>
              <input type="hidden" name="postId" value={postId} />
              <ConfirmSubmit
                label={t.post.closeRequest}
                confirmTitle={t.common.confirmTitle}
                confirmBody={t.common.doubleConfirm}
                confirmLabel={t.common.confirm}
                cancelLabel={t.common.cancel}
                className="btn-secondary btn-sm"
              />
            </form>
          )}
          <form action={deleteOwnPost}>
            <input type="hidden" name="postId" value={postId} />
            <ConfirmSubmit
              label={t.common.delete}
              confirmTitle={t.common.confirmTitle}
              confirmBody={t.common.doubleConfirm}
              confirmLabel={t.common.delete}
              cancelLabel={t.common.cancel}
              destructive
              className="btn-sm inline-flex items-center rounded-full bg-negative-soft px-3.5 font-semibold text-negative transition hover:bg-negative hover:text-white"
            />
          </form>
          <Link
            href="/dashboard/posts"
            className="whitespace-nowrap px-1 text-xs font-semibold text-ink-faint transition hover:text-ink"
          >
            {t.dashboard.myPostsSummary}
          </Link>
        </div>
      </div>
      {status === POST_STATUS.REJECTED && rejectReason && (
        <p className="mt-2.5 rounded-lg bg-negative-soft px-3 py-2 text-xs text-negative">
          {t.post.rejectionReason}: {rejectReason}
        </p>
      )}
    </section>
  );
}
