import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getMenuBySlug } from "@/lib/data/menus";
import { getFullPost, getPostTeaser } from "@/lib/data/posts";
import { getSession } from "@/lib/data/session";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import { postMediaUrl, repThumbnail, videoEmbedUrl } from "@/lib/media";
import { BadgePill } from "@/components/ui/Badge";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { MediaGallery } from "@/components/post/MediaGallery";
import { BOARD_TYPES, POST_STATUS, SETTING_KEYS } from "@/lib/constants";
import { isRichText, sanitizeRichText, stripRichText } from "@/lib/richtext";
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ menuSlug: string; postId: string }>;
}): Promise<Metadata> {
  const { postId } = await props.params;
  const teaser = await getPostTeaser(postId);
  if (!teaser) return {};
  const description = stripRichText(teaser.body_teaser_en).slice(0, 160);
  const image = repThumbnail(teaser);
  return {
    title: teaser.title_en,
    description,
    openGraph: {
      title: teaser.title_en,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PostDetailPage(props: {
  params: Promise<{ menuSlug: string; postId: string }>;
}) {
  const { menuSlug, postId } = await props.params;
  const [menu, { t, locale }, session, settings] = await Promise.all([
    getMenuBySlug(menuSlug),
    getT(),
    getSession(),
    getPublicSettings(),
  ]);
  if (!menu) notFound();

  const isMember = !!session.userId;
  const autoplay = settingBool(settings, SETTING_KEYS.VIDEO_AUTOPLAY, false);

  // Members read the full row through RLS; visitors only ever receive the
  // teaser view. The fade below is presentation; the data is truly absent.
  const full = isMember ? await getFullPost(postId) : null;
  const teaser = full ? null : await getPostTeaser(postId);
  if (!full && !teaser) notFound();

  const post = full?.post ?? null;
  const title =
    locale === "ko"
      ? (post?.title_ko ?? teaser?.title_ko ?? post?.title_en ?? teaser?.title_en)
      : (post?.title_en ?? teaser?.title_en);
  const repImage = post?.rep_image_path ?? teaser?.rep_image_path ?? null;
  const repVideo = post?.rep_video_url ?? teaser?.rep_video_url ?? null;
  const embed = repVideo ? videoEmbedUrl(repVideo, autoplay) : null;
  // The author's explicit representative choice decides the hero; a post
  // without images always fronts its video.
  const videoIsHero =
    !!embed && ((post?.rep_is_video ?? teaser?.rep_is_video) || !repImage);

  // Lightbox gallery (members only; teasers keep the static hero).
  const galleryPaths = full ? full.media.map((m) => m.path) : [];
  if (full && repImage && !galleryPaths.includes(repImage)) {
    galleryPaths.unshift(repImage);
  }
  const galleryImages = galleryPaths.map(postMediaUrl);
  const heroIndex = repImage ? Math.max(0, galleryPaths.indexOf(repImage)) : 0;

  const isOwn = !!post && post.author_id === session.userId;
  const isClosed =
    (post?.status ?? teaser?.status) === POST_STATUS.CLOSED ||
    (!!(post?.deadline ?? teaser?.deadline) &&
      (post?.deadline ?? teaser?.deadline)! < new Date().toISOString().slice(0, 10));
  const isRequest = (post?.type ?? teaser?.type) === BOARD_TYPES.REQUEST;

  const statusLabels: Record<string, string> = t.post.status;

  return (
    <article className="space-y-6">
      {/* Own-post review status banner (PRD 14: waiting made transparent) */}
      {isOwn && post && post.status !== POST_STATUS.APPROVED && (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface-sub/60 px-4 py-3">
          <StatusLabel status={post.status} label={statusLabels[post.status] ?? post.status} />
          {post.status === POST_STATUS.REJECTED && post.reject_reason && (
            <p className="text-xs text-ink-soft">
              {t.post.rejectionReason}: {post.reject_reason}
            </p>
          )}
        </div>
      )}

      {/* Representative media: player on detail only (PRD 6.8) */}
      {videoIsHero ? (
        <div className="space-y-2">
          <div className="aspect-video overflow-hidden rounded-card bg-surface-sub">
            <iframe
              src={embed!}
              title={title ?? ""}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          {galleryImages.length > 0 && (
            <MediaGallery
              images={galleryImages}
              heroIndex={heroIndex}
              showHero={false}
              title={title ?? ""}
              closeLabel={t.common.close}
            />
          )}
        </div>
      ) : galleryImages.length > 0 || repImage ? (
        <div className="space-y-2">
          {galleryImages.length > 0 ? (
            <MediaGallery
              images={galleryImages}
              heroIndex={heroIndex}
              showHero
              title={title ?? ""}
              closeLabel={t.common.close}
            />
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-card bg-surface-sub">
              <Image
                src={postMediaUrl(repImage!)}
                alt={title ?? ""}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}
          {/* Image is representative, but an attached video still plays here. */}
          {embed && (
            <div className="aspect-video overflow-hidden rounded-card bg-surface-sub">
              <iframe
                src={embed}
                title={title ?? ""}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      ) : null}

      <header className="space-y-2">
        <h1 className="text-xl font-extrabold leading-snug">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <span>{t.post.postedBy}</span>
          <Link
            href={`/u/${full?.author?.uid ?? teaser?.author_uid}`}
            className="font-semibold text-ink hover:text-primary-strong"
          >
            {(full?.author?.company_name ?? full?.author?.display_name) ??
              (teaser?.author_company ?? teaser?.author_name)}
          </Link>
          {full?.author?.badges.map((b) => (
            <BadgePill
              key={b.code}
              code={b.code}
              label={locale === "ko" ? b.name_ko : b.name_en}
            />
          ))}
          {isRequest && (
            <StatusLabel
              status={isClosed ? "closed" : "approved"}
              label={
                isClosed
                  ? t.post.closed
                  : (post?.deadline ?? teaser?.deadline)
                    ? `${t.post.deadline} ${post?.deadline ?? teaser?.deadline}`
                    : t.post.openEnded
              }
            />
          )}
        </div>
      </header>

      {full ? (
        <>
          {(() => {
            const body =
              locale === "ko" && full.post.body_ko
                ? full.post.body_ko
                : full.post.body_en;
            return isRichText(body) ? (
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {body}
              </div>
            );
          })()}

          {full.specs.length > 0 && (
            <section>
              <h2 className="text-base font-bold">{t.post.specs}</h2>
              <dl className="mt-2 divide-y divide-line rounded-card border border-line">
                {full.specs.map((spec) => (
                  <div key={spec.id} className="flex gap-4 px-4 py-2.5 text-sm">
                    <dt className="w-36 shrink-0 font-semibold text-ink-soft">
                      {locale === "ko" && spec.name_ko ? spec.name_ko : spec.name_en}
                    </dt>
                    <dd className="text-ink">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {full.attachments.length > 0 && (
            <section>
              <h2 className="text-base font-bold">{t.post.attachments}</h2>
              <ul className="mt-2 space-y-1.5">
                {full.attachments.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/api/attachments/${a.id}`}
                      className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-primary-strong hover:bg-primary-soft/40"
                    >
                      {a.filename}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isOwn && post?.status === POST_STATUS.APPROVED && (
            <div className="sticky bottom-4">
              {isClosed && isRequest ? (
                <button
                  disabled
                  className="w-full rounded-xl bg-surface-sub px-4 py-3.5 text-sm font-bold text-ink-faint"
                >
                  {t.post.closed}
                </button>
              ) : (
                <Link
                  href={`/inquiries/new?post=${post.id}`}
                  className="block w-full rounded-xl bg-primary px-4 py-3.5 text-center text-sm font-bold text-white shadow-lg hover:bg-primary-strong"
                >
                  {t.post.inquire}
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        teaser && (
          <>
            {/* Gradient lock: only teaser data was ever sent to the client */}
            <div className="teaser-fade whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {stripRichText(
                locale === "ko" && teaser.body_teaser_ko
                  ? teaser.body_teaser_ko
                  : teaser.body_teaser_en
              )}
            </div>
            <div className="rounded-card border border-line bg-surface-sub/60 p-6 text-center">
              <p className="text-base font-bold">{t.post.membersOnlyTitle}</p>
              <p className="mt-1 text-sm text-ink-soft">{t.post.membersOnlyBody}</p>
              <Link
                href={`/login?next=/${menu.slug}/${postId}`}
                className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-strong"
              >
                {t.post.signInToContinue}
              </Link>
            </div>
          </>
        )
      )}
    </article>
  );
}
