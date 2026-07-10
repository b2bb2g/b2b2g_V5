import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { closeOwnPost, deleteOwnPost } from "@/app/actions/posts";
import { BOARD_TYPES, POST_STATUS } from "@/lib/constants";
import type { Post } from "@/lib/types";

// My posts + review status + drafts (PRD 6.5).
export default async function MyPostsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: posts } = await supabase
    .from("posts")
    .select("*, menus(slug, title_en, title_ko)")
    .eq("author_id", session.userId)
    .order("updated_at", { ascending: false });

  const rows = (posts ?? []) as unknown as (Post & {
    menus: { slug: string; title_en: string; title_ko: string } | null;
  })[];
  const statusLabels: Record<string, string> = t.post.status;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.dashboard.myPostsSummary}
        action={
          <Link href="/write/select" className="btn-primary btn-md">
            {t.post.writePost}
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title={t.common.emptyList} hint={t.common.emptyListHint} />
      ) : (
        <div className="space-y-2.5">
          {rows.map((post) => (
            <div key={post.id} className="rounded-card border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {locale === "ko" && post.title_ko ? post.title_ko : post.title_en}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {post.menus?.title_en ?? ""}
                    {" · "}
                    {new Date(post.updated_at).toISOString().slice(0, 10)}
                  </p>
                </div>
                <StatusLabel
                  status={post.status}
                  label={statusLabels[post.status] ?? post.status}
                />
              </div>

              {post.status === POST_STATUS.REJECTED && post.reject_reason && (
                <p className="mt-2 rounded-lg bg-negative-soft px-3 py-2 text-xs text-negative">
                  {t.post.rejectionReason}: {post.reject_reason}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {post.status === POST_STATUS.APPROVED && post.menus && (
                  <Link
                    href={`/${post.menus.slug}/${post.id}`}
                    className="rounded-lg bg-surface-sub px-3 py-1.5 text-xs font-semibold text-ink-soft"
                  >
                    {t.common.seeMore}
                  </Link>
                )}
                {post.menus && (
                  <Link
                    href={`/write?menu=${post.menus.slug}&post=${post.id}`}
                    className="rounded-lg bg-surface-sub px-3 py-1.5 text-xs font-semibold text-ink-soft"
                  >
                    {t.common.edit}
                  </Link>
                )}
                {post.type === BOARD_TYPES.REQUEST &&
                  post.status === POST_STATUS.APPROVED && (
                    <form action={closeOwnPost}>
                      <input type="hidden" name="postId" value={post.id} />
                      <ConfirmSubmit
                        label={t.post.closed}
                        confirmTitle={t.common.confirmTitle}
                        confirmBody={t.common.doubleConfirm}
                        confirmLabel={t.common.confirm}
                        cancelLabel={t.common.cancel}
                        className="rounded-lg bg-surface-sub px-3 py-1.5 text-xs font-semibold text-ink-soft"
                      />
                    </form>
                  )}
                <form action={deleteOwnPost}>
                  <input type="hidden" name="postId" value={post.id} />
                  <ConfirmSubmit
                    label={t.common.delete}
                    confirmTitle={t.common.confirmTitle}
                    confirmBody={t.common.doubleConfirm}
                    confirmLabel={t.common.delete}
                    cancelLabel={t.common.cancel}
                    className="rounded-lg bg-negative-soft px-3 py-1.5 text-xs font-semibold text-negative"
                    destructive
                  />
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
