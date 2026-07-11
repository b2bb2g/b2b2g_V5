import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { DashboardIcon } from "@/components/dashboard/DashboardCards";
import { closeOwnPost, deleteOwnPost } from "@/app/actions/posts";
import {
  BADGE_CODES,
  BOARD_TYPES,
  POST_STATUS,
  SETTING_KEYS,
} from "@/lib/constants";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import { postMediaUrl } from "@/lib/media";
import type { Post } from "@/lib/types";

const FILTERABLE_STATUSES = [
  POST_STATUS.PENDING,
  POST_STATUS.APPROVED,
  POST_STATUS.REJECTED,
  POST_STATUS.CLOSED,
] as const;

export default async function MyPostsPage(props: {
  searchParams: Promise<{ view?: string; q?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t, locale }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);
  const draftsView = params.view === "drafts";
  const queryText = (params.q ?? "").trim().toLocaleLowerCase();
  const statusFilter = FILTERABLE_STATUSES.includes(
    params.status as (typeof FILTERABLE_STATUSES)[number],
  )
    ? params.status
    : "";

  let query = supabase
    .from("posts")
    .select("*, menus(slug, title_en, title_ko)")
    .eq("author_id", session.userId)
    .order("updated_at", { ascending: false });
  query = draftsView
    ? query.eq("status", POST_STATUS.DRAFT)
    : query.neq("status", POST_STATUS.DRAFT);
  if (!draftsView && statusFilter) query = query.eq("status", statusFilter);
  const { data: posts } = await query;

  const allRows = (posts ?? []) as unknown as (Post & {
    menus: { slug: string; title_en: string; title_ko: string } | null;
  })[];
  const rows = queryText
    ? allRows.filter((post) =>
        [post.title_en, post.title_ko, post.body_en, post.body_ko]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(queryText)),
      )
    : allRows;

  const isPaid = session.badges.some(
    (badge) => badge.badge_types?.code === BADGE_CODES.CERTIFIED,
  );
  let quota: { used: number; limit: number } | null = null;
  if (!isPaid && !session.profile?.is_admin) {
    const [settings, { count }] = await Promise.all([
      getPublicSettings(),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", session.userId)
        .neq("status", POST_STATUS.DRAFT),
    ]);
    quota = {
      used: count ?? 0,
      limit: settingNumber(settings, SETTING_KEYS.FREE_POST_LIMIT, 3),
    };
  }
  const statusLabels: Record<string, string> = t.post.status;

  return (
    <div className="space-y-4">
      <WorkspacePageHeader
        eyebrow={t.dashboard.commandCenter}
        title={t.dashboard.myPostsSummary}
        description={t.dashboard.postManagementHint}
        action={
          <Link href="/write/select" className="btn-primary btn-md">
            {t.post.writePost}
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-full bg-surface-sub p-1">
          {[
            { key: "", label: t.dashboard.myPostsSummary },
            { key: "drafts", label: t.post.status.draft },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={
                tab.key
                  ? `/dashboard/posts?view=${tab.key}`
                  : "/dashboard/posts"
              }
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                (tab.key === "drafts") === draftsView
                  ? "bg-[#101923] text-white shadow-sm"
                  : "text-ink-soft hover:text-primary"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {quota && !draftsView && (
          <p
            className={`text-xs font-semibold ${quota.used >= quota.limit ? "text-negative" : "text-ink-faint"}`}
          >
            {quota.used >= quota.limit
              ? t.post.quotaBlocked
              : t.post.quotaLine
                  .replace("{used}", String(quota.used))
                  .replace("{limit}", String(quota.limit))}
          </p>
        )}
      </div>

      <form className="grid gap-2 rounded-[1.15rem] border border-line bg-white p-3 shadow-[0_8px_24px_rgba(25,31,40,.04)] sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
        {draftsView && <input type="hidden" name="view" value="drafts" />}
        <label className="relative">
          <span className="sr-only">{t.dashboard.searchMyPosts}</span>
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={t.dashboard.searchMyPosts}
            className="h-10 w-full rounded-xl border border-line bg-surface-sub px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </label>
        {!draftsView ? (
          <select
            name="status"
            defaultValue={statusFilter}
            aria-label={t.dashboard.allStatuses}
            className="h-10 rounded-xl border border-line bg-surface-sub px-3 text-sm text-ink-soft outline-none focus:border-primary"
          >
            <option value="">{t.dashboard.allStatuses}</option>
            {FILTERABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}
        <button type="submit" className="btn-secondary btn-md">
          {t.common.search}
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={t.common.emptyList} hint={t.common.emptyListHint} />
      ) : (
        <div className="rounded-[1.35rem] border border-line bg-white shadow-(--shadow-card)">
          <div className="divide-y divide-line">
            {rows.map((post) => {
              const title =
                locale === "ko" && post.title_ko
                  ? post.title_ko
                  : post.title_en;
              const publicHref = post.menus
                ? `/${post.menus.slug}/${post.id}`
                : null;
              return (
                <article
                  key={post.id}
                  className="grid gap-3 p-4 transition hover:bg-surface-sub/45 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-sub">
                    {post.rep_image_path ? (
                      <Image
                        src={postMediaUrl(post.rep_image_path)}
                        alt=""
                        fill
                        sizes="88px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-ink-faint">
                        <DashboardIcon name="posts" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusLabel
                        status={post.status}
                        label={statusLabels[post.status] ?? post.status}
                      />
                      <span className="text-xs text-ink-faint">
                        {locale === "ko" && post.menus?.title_ko
                          ? post.menus.title_ko
                          : (post.menus?.title_en ?? "")}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-sm font-extrabold">
                      {title}
                    </h3>
                    <p className="mt-1 text-xs text-ink-faint">
                      {t.dashboard.updated}{" "}
                      {new Date(post.updated_at).toISOString().slice(0, 10)}
                    </p>
                    {post.status === POST_STATUS.REJECTED &&
                      post.reject_reason && (
                        <p className="mt-2 line-clamp-2 rounded-lg bg-negative-soft px-3 py-2 text-xs text-negative">
                          {t.post.rejectionReason}: {post.reject_reason}
                        </p>
                      )}
                  </div>
                  <div className="flex items-center justify-end gap-2 sm:self-center">
                    {post.menus && (
                      <Link
                        href={`/write?menu=${post.menus.slug}&post=${post.id}`}
                        className="btn-secondary btn-sm"
                      >
                        {t.common.edit}
                      </Link>
                    )}
                    <details className="group relative">
                      <summary
                        aria-label={t.dashboard.actions}
                        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl border border-line text-lg text-ink-soft hover:bg-surface-sub"
                      >
                        ⋯
                      </summary>
                      <div className="absolute right-0 top-11 z-20 w-36 space-y-1 rounded-xl border border-line bg-white p-2 shadow-lg">
                        {post.status === POST_STATUS.APPROVED && publicHref && (
                          <Link
                            href={publicHref}
                            className="block rounded-lg px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-surface-sub"
                          >
                            {t.common.seeMore}
                          </Link>
                        )}
                        {post.type === BOARD_TYPES.REQUEST &&
                          post.status === POST_STATUS.APPROVED && (
                            <form action={closeOwnPost}>
                              <input
                                type="hidden"
                                name="postId"
                                value={post.id}
                              />
                              <ConfirmSubmit
                                label={t.post.closeRequest}
                                confirmTitle={t.common.confirmTitle}
                                confirmBody={t.common.doubleConfirm}
                                confirmLabel={t.common.confirm}
                                cancelLabel={t.common.cancel}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink-soft hover:bg-surface-sub"
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
                            className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-negative hover:bg-negative-soft"
                            destructive
                          />
                        </form>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
