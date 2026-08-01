import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { PendingButton } from "@/components/ui/PendingButton";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { adminDeletePost, moderatePostInline } from "@/app/actions/admin/posts";
import { POST_STATUS } from "@/lib/constants";

// Console staff toolbar on the public post detail page (PRD 17 convenience):
// approve / hold / edit / delete without a round trip through the moderation
// queue. Rendered only after the server has verified the viewer's console
// permission; every action re-verifies on submit. The dark surface matches
// the admin console identity so it reads as operator UI, not member UI.
export async function AdminPostControls({
  postId,
  menuSlug,
  status,
  canReview,
  canContent,
}: {
  postId: string;
  menuSlug: string;
  status: string;
  canReview: boolean;
  canContent: boolean;
}) {
  const { t } = await getT();
  const approved = status === POST_STATUS.APPROVED;

  return (
    <section
      aria-label={t.admin.postControlsTitle}
      className="rounded-[1.25rem] bg-[#101923] px-4 py-3 text-white shadow-[0_14px_40px_rgba(16,25,35,.18)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <p className="whitespace-nowrap text-xs font-bold uppercase tracking-[.14em] text-white/55">
            {t.admin.postControlsTitle}
          </p>
          <StatusLabel
            status={status}
            label={t.post.status[status as keyof typeof t.post.status] ?? status}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canReview && !approved && (
            <form action={moderatePostInline}>
              <input type="hidden" name="postId" value={postId} />
              <input type="hidden" name="menuSlug" value={menuSlug} />
              <input type="hidden" name="decision" value="approve" />
              <PendingButton className="btn-primary btn-sm">
                {t.admin.postControlsApprove}
              </PendingButton>
            </form>
          )}
          {canReview && approved && (
            <form action={moderatePostInline}>
              <input type="hidden" name="postId" value={postId} />
              <input type="hidden" name="menuSlug" value={menuSlug} />
              <input type="hidden" name="decision" value="hold" />
              <PendingButton className="btn-sm inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3.5 font-semibold text-white transition hover:bg-white/20">
                {t.admin.postControlsHold}
              </PendingButton>
            </form>
          )}
          {canContent && (
            <Link
              href={`/write?menu=${menuSlug}&post=${postId}`}
              className="btn-sm inline-flex items-center rounded-full bg-white/12 px-3.5 font-semibold text-white transition hover:bg-white/20"
            >
              {t.admin.postControlsEdit}
            </Link>
          )}
          {canContent && (
            <form action={adminDeletePost}>
              <input type="hidden" name="postId" value={postId} />
              <input type="hidden" name="menuSlug" value={menuSlug} />
              <ConfirmSubmit
                label={t.admin.postControlsDelete}
                confirmTitle={t.admin.postControlsDeleteTitle}
                confirmBody={t.admin.postControlsDeleteBody}
                confirmLabel={t.admin.postControlsDelete}
                cancelLabel={t.common.cancel}
                destructive
                className="btn-sm inline-flex items-center rounded-full bg-negative/85 px-3.5 font-semibold text-white transition hover:bg-negative"
              />
            </form>
          )}
          {canReview && (
            <Link
              href="/admin/moderation"
              className="whitespace-nowrap px-1 text-xs font-semibold text-white/55 transition hover:text-white"
            >
              {t.admin.postControlsQueue}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
