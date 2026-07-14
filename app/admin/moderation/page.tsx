import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewPost } from "@/app/actions/admin/reviews";
import { POST_STATUS } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { ReviewDecisionForm } from "@/components/admin/ReviewDecisionForm";

const PAGE_SIZE = 20;

export default async function ModerationPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ t, locale }, supabase, params] = await Promise.all([
    getT(),
    createClient(),
    props.searchParams,
  ]);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(uid, display_name, company_name), menus(title_en, title_ko)", { count: "exact" })
    .eq("status", POST_STATUS.PENDING)
    .order("created_at")
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error("[admin/moderation] Failed to load moderation queue", error);
    return (
      <div className="space-y-3">
        <h2 className="text-base font-bold">{t.admin.moderation}</h2>
        <p role="alert" className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative">
          {t.admin.dataLoadFailed}
        </p>
      </div>
    );
  }

  const posts = (data ?? []) as unknown as (Post & {
    profiles: { uid: number; display_name: string | null; company_name: string | null } | null;
    menus: { title_en: string; title_ko: string } | null;
  })[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-base font-bold">{t.admin.moderation}</h2>
        {(count ?? 0) > 0 && (
          <span className="rounded-full bg-caution-soft px-2.5 py-0.5 text-xs font-bold text-caution">
            {count} {t.admin.awaitingReview}
          </span>
        )}
      </div>
      {posts.length === 0 ? (
        <EmptyState title={t.admin.noPending} />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-(--shadow-card)">
              <p className="text-xs font-semibold text-ink-faint">
                {post.menus
                  ? locale === "ko"
                    ? post.menus.title_ko
                    : post.menus.title_en
                  : ""}
                {" · "}
                {post.profiles?.company_name ?? post.profiles?.display_name}
                {" · UID "}
                {post.profiles?.uid}
              </p>
              <p className="mt-1 text-sm font-bold">{post.title_en}</p>
              {post.title_ko && (
                <p className="text-sm text-ink-soft">{post.title_ko}</p>
              )}
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">
                {post.body_en}
              </p>
              <ReviewDecisionForm
                action={reviewPost}
                idField="postId"
                idValue={post.id}
                approveValue="approve"
                approveLabel={t.admin.approve}
                rejectValue="reject"
                rejectLabel={t.admin.reject}
                confirmRejectLabel={t.admin.confirmReturn}
                reasonPlaceholder={t.admin.rejectReason}
                cancelLabel={t.common.cancel}
              />
            </article>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} basePath="/admin/moderation" prevLabel={t.home.prev} nextLabel={t.home.next} />
    </div>
  );
}
