import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getMenuBySlug } from "@/lib/data/menus";
import { listPostsForMenu } from "@/lib/data/posts";
import { postMediaUrl, videoThumbnail } from "@/lib/media";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { BOARD_TYPES, POST_STATUS } from "@/lib/constants";
import type { PostTeaser } from "@/lib/types";
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ menuSlug: string }>;
}): Promise<Metadata> {
  const { menuSlug } = await props.params;
  const menu = await getMenuBySlug(menuSlug);
  if (!menu) return {};
  return { title: menu.title_en };
}

function thumbnail(post: PostTeaser): string | null {
  if (post.rep_image_path) return postMediaUrl(post.rep_image_path);
  if (post.rep_video_url) return videoThumbnail(post.rep_video_url);
  return null;
}

export default async function BoardPage(props: {
  params: Promise<{ menuSlug: string }>;
}) {
  const { menuSlug } = await props.params;
  const menu = await getMenuBySlug(menuSlug);
  if (!menu || !menu.is_visible) notFound();

  const [{ t, locale }, posts] = await Promise.all([
    getT(),
    listPostsForMenu(menu.id),
  ]);

  const title = locale === "ko" ? menu.title_ko : menu.title_en;
  const isRequestBoard = menu.board_type === BOARD_TYPES.REQUEST;
  const isGallery =
    menu.board_type === BOARD_TYPES.PRODUCT ||
    menu.board_type === BOARD_TYPES.FLEXIBLE;

  return (
    <div className="wide space-y-4">
      {/* Creation lives on the dashboard and avatar menu only (UX policy). */}
      <h1 className="text-xl font-extrabold">{title}</h1>

      {posts.length === 0 ? (
        <EmptyState title={t.common.emptyList} hint={t.common.emptyListHint} />
      ) : isGallery ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {posts.map((post) => {
            const thumb = thumbnail(post);
            return (
              <Link
                key={post.id}
                href={`/${menu.slug}/${post.id}`}
                className="group overflow-hidden rounded-card border border-line bg-surface"
              >
                <div className="relative aspect-square bg-surface-sub">
                  {thumb && (
                    <Image
                      src={thumb}
                      alt={post.title_en}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-2 text-sm font-bold leading-snug">
                    {locale === "ko" && post.title_ko ? post.title_ko : post.title_en}
                  </p>
                  <p className="truncate text-xs text-ink-faint">
                    {post.author_company ?? post.author_name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {posts.map((post) => {
            const closed =
              post.status === POST_STATUS.CLOSED ||
              (isRequestBoard && post.deadline && post.deadline < new Date().toISOString().slice(0, 10));
            return (
              <Link
                key={post.id}
                href={`/${menu.slug}/${post.id}`}
                className="block rounded-card border border-line bg-surface p-4 hover:border-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold leading-snug">
                    {locale === "ko" && post.title_ko ? post.title_ko : post.title_en}
                  </p>
                  {isRequestBoard && (
                    <StatusLabel
                      status={closed ? "closed" : "approved"}
                      label={
                        closed
                          ? t.post.closed
                          : post.deadline
                            ? `${t.post.deadline} ${post.deadline}`
                            : t.post.openEnded
                      }
                    />
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                  {locale === "ko" && post.body_teaser_ko
                    ? post.body_teaser_ko
                    : post.body_teaser_en}
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  {post.author_company ?? post.author_name}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
