import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getMenuBySlug } from "@/lib/data/menus";
import { getFullPost, getPostTeaser } from "@/lib/data/posts";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import { postMediaUrl, repThumbnail, videoEmbedUrl } from "@/lib/media";
import { BadgePill } from "@/components/ui/Badge";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { MediaGallery } from "@/components/post/MediaGallery";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { BOARD_TYPES, POST_STATUS, SETTING_KEYS } from "@/lib/constants";
import { isRichText, sanitizeRichText, stripRichText } from "@/lib/richtext";
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ menuSlug: string; postId: string }>;
}): Promise<Metadata> {
  const { menuSlug, postId } = await props.params;
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
    alternates: { canonical: `/${menuSlug}/${postId}` },
    twitter: {
      card: "summary_large_image",
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
  const isNotice =
    menu.slug === "notices" && menu.board_type === BOARD_TYPES.NOTICE;
  const autoplay = settingBool(settings, SETTING_KEYS.VIDEO_AUTOPLAY, false);

  // Members read the full row through RLS; visitors only ever receive the
  // teaser view. The fade below is presentation; the data is truly absent.
  const full = isMember || isNotice ? await getFullPost(postId) : null;
  const teaser = full ? null : await getPostTeaser(postId);
  if (!full && !teaser) notFound();

  const post = full?.post ?? null;
  const title =
    locale === "ko"
      ? (post?.title_ko ??
        teaser?.title_ko ??
        post?.title_en ??
        teaser?.title_en)
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
      (post?.deadline ?? teaser?.deadline)! <
        new Date().toISOString().slice(0, 10));
  const isRequest = (post?.type ?? teaser?.type) === BOARD_TYPES.REQUEST;

  const statusLabels: Record<string, string> = t.post.status;
  const authorUid = full?.author?.uid ?? teaser?.author_uid;
  const authorName =
    full?.author?.company_name ??
    full?.author?.display_name ??
    teaser?.author_company ??
    teaser?.author_name;

  if (isNotice && full) {
    const body =
      locale === "ko" && full.post.body_ko
        ? full.post.body_ko
        : full.post.body_en;
    const publishedAt = full.post.published_at ?? full.post.created_at;
    const noticeImage = full.post.rep_image_path
      ? postMediaUrl(full.post.rep_image_path)
      : null;
    const supabase = await createClient();
    const { data: noticeRows } = await supabase
      .from("public_posts")
      .select(
        "id, title_en, title_ko, rep_image_path, rep_video_url, published_at",
      )
      .eq("menu_id", menu.id)
      .order("published_at", { ascending: false })
      .limit(20);
    const notices = noticeRows ?? [];
    const currentIndex = notices.findIndex((item) => item.id === postId);
    const previousNotice = currentIndex >= 0 ? notices[currentIndex + 1] : null;
    const nextNotice = currentIndex > 0 ? notices[currentIndex - 1] : null;
    const relatedNotices = notices
      .filter((item) => item.id !== postId)
      .slice(0, 3);
    return (
      <article className="wide space-y-5">
        <nav aria-label={t.board.backToNotices}>
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft transition hover:text-primary"
          >
            <span aria-hidden="true">←</span>
            {t.board.backToNotices}
          </Link>
        </nav>
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-line/80 bg-white shadow-[0_20px_65px_rgba(25,31,40,.08)]">
          <header className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
            <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.14em]">
              {t.board.officialNotice}
            </span>
            <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-[-.04em] text-ink sm:text-4xl">
              {title}
            </h1>
            <time
              dateTime={publishedAt}
              className="mt-5 block text-xs font-semibold text-ink-faint"
            >
              {publishedAt.slice(0, 10)}
            </time>
          </header>
          {noticeImage && (
            <div className="relative aspect-[16/7] overflow-hidden bg-surface-sub">
              <Image
                src={noticeImage}
                alt=""
                fill
                priority
                sizes="(max-width:896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          )}
          <section className="border-t border-line px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            {isRichText(body) ? (
              <div
                className="rich-content notice-content"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-base leading-8 text-ink">
                {body}
              </div>
            )}
            {full.attachments.length > 0 && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="text-base font-extrabold">
                  {t.post.attachments}
                </h2>
                <ul className="mt-4 space-y-2">
                  {full.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <Link
                        href={`/api/attachments/${attachment.id}`}
                        className="group flex items-center justify-between rounded-2xl bg-surface-sub px-4 py-3.5 text-sm font-bold text-ink transition hover:bg-primary-soft hover:text-primary-strong"
                      >
                        <span className="min-w-0 truncate">
                          {attachment.filename}
                        </span>
                        <span
                          className="ml-4 text-primary transition-transform group-hover:translate-y-0.5"
                          aria-hidden="true"
                        >
                          ↓
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>
        </div>
        {(previousNotice || nextNotice) && (
          <nav
            className="mx-auto grid w-full max-w-4xl gap-3 sm:grid-cols-2"
            aria-label={t.board.relatedNotices}
          >
            {previousNotice ? (
              <Link
                href={`/notices/${previousNotice.id}`}
                className="group rounded-[1.5rem] border border-line/80 bg-white p-5 shadow-(--shadow-card)"
              >
                <span className="text-xs font-bold text-ink-faint">
                  ← {t.board.previousNotice}
                </span>
                <strong className="mt-2 block line-clamp-2 text-sm font-extrabold group-hover:text-primary">
                  {locale === "ko" && previousNotice.title_ko
                    ? previousNotice.title_ko
                    : previousNotice.title_en}
                </strong>
              </Link>
            ) : (
              <span />
            )}
            {nextNotice && (
              <Link
                href={`/notices/${nextNotice.id}`}
                className="group rounded-[1.5rem] border border-line/80 bg-white p-5 text-right shadow-(--shadow-card)"
              >
                <span className="text-xs font-bold text-ink-faint">
                  {t.board.nextNotice} →
                </span>
                <strong className="mt-2 block line-clamp-2 text-sm font-extrabold group-hover:text-primary">
                  {locale === "ko" && nextNotice.title_ko
                    ? nextNotice.title_ko
                    : nextNotice.title_en}
                </strong>
              </Link>
            )}
          </nav>
        )}
        {relatedNotices.length > 0 && (
          <section className="mx-auto w-full max-w-4xl pb-3 pt-5">
            <h2 className="text-xl font-extrabold">{t.board.relatedNotices}</h2>
            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-line/80 bg-white shadow-(--shadow-card)">
              {relatedNotices.map((item) => {
                const thumbnail = repThumbnail(item);
                return (
                  <Link
                    key={item.id}
                    href={`/notices/${item.id}`}
                    className={`group grid items-center gap-4 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-surface-sub ${thumbnail ? "grid-cols-[6rem_1fr_auto]" : "grid-cols-[1fr_auto]"}`}
                  >
                    {thumbnail && (
                      <span className="relative block aspect-[3/2] overflow-hidden rounded-xl bg-surface-sub">
                        <Image
                          src={thumbnail}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </span>
                    )}
                    <span className="min-w-0">
                      <strong className="line-clamp-2 text-sm font-extrabold leading-snug group-hover:text-primary">
                        {locale === "ko" && item.title_ko
                          ? item.title_ko
                          : item.title_en}
                      </strong>
                      <span className="mt-2 block text-xs text-ink-faint">
                        {item.published_at?.slice(0, 10)}
                      </span>
                    </span>
                    <span
                      className="text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-primary"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </article>
    );
  }

  return (
    <article className="wide space-y-6">
      {/* Own-post review status banner (PRD 14: waiting made transparent) */}
      {isOwn && post && post.status !== POST_STATUS.APPROVED && (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface-sub/60 px-4 py-3">
          <StatusLabel
            status={post.status}
            label={statusLabels[post.status] ?? post.status}
          />
          {post.status === POST_STATUS.REJECTED && post.reject_reason && (
            <p className="text-xs text-ink-soft">
              {t.post.rejectionReason}: {post.reject_reason}
            </p>
          )}
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
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
          ) : !isRequest ? (
            <div className="aspect-video overflow-hidden rounded-[1.25rem] border border-line">
              <MediaPlaceholder />
            </div>
          ) : null}

          <header className="space-y-2">
            <h1 className="text-xl font-extrabold leading-snug">{title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span>{t.post.postedBy}</span>
              <Link
                href={`/u/${authorUid}`}
                className="font-semibold text-ink hover:text-primary-strong"
              >
                {authorName}
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
                      <div
                        key={spec.id}
                        className="flex gap-4 px-4 py-2.5 text-sm"
                      >
                        <dt className="w-36 shrink-0 font-semibold text-ink-soft">
                          {locale === "ko" && spec.name_ko
                            ? spec.name_ko
                            : spec.name_en}
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
            </>
          ) : (
            teaser && (
              <>
                {/* Gradient lock: only teaser data was ever sent to the client */}
                <div className="teaser-fade whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {stripRichText(
                    locale === "ko" && teaser.body_teaser_ko
                      ? teaser.body_teaser_ko
                      : teaser.body_teaser_en,
                  )}
                </div>
                <div className="rounded-card border border-line bg-surface-sub/60 p-6 text-center">
                  <p className="text-base font-bold">
                    {t.post.membersOnlyTitle}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {t.post.membersOnlyBody}
                  </p>
                  <Link
                    href="/signup"
                    className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-strong"
                  >
                    {t.common.signUp}
                  </Link>
                </div>
              </>
            )
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24">
          <section className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-(--shadow-card)">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-faint">
              {t.post.supplierProfile}
            </p>
            <Link
              href={`/u/${authorUid}`}
              className="mt-3 block text-lg font-extrabold hover:text-primary-strong"
            >
              {authorName}
            </Link>
            {full?.author?.badges && full.author.badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {full.author.badges.map((badge) => (
                  <BadgePill
                    key={badge.code}
                    code={badge.code}
                    label={locale === "ko" ? badge.name_ko : badge.name_en}
                  />
                ))}
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              {t.post.supplierTrustHint}
            </p>
            <Link
              href={`/u/${authorUid}`}
              className="btn-secondary btn-md mt-4 w-full"
            >
              {t.post.viewCompany}
            </Link>
          </section>

          {!isOwn && (
            <section className="mobile-sticky-action rounded-[1.25rem] bg-ink p-5 text-white shadow-(--shadow-float) max-lg:sticky max-lg:bottom-3">
              <p className="text-base font-extrabold">
                {isMember ? t.post.inquire : t.common.signUp}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                {isMember ? t.post.inquiryHint : t.post.signUpToInquire}
              </p>
              {isMember && post?.status === POST_STATUS.APPROVED ? (
                isClosed && isRequest ? (
                  <button
                    disabled
                    className="mt-5 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white/40"
                  >
                    {t.post.closed}
                  </button>
                ) : (
                  <Link
                    href={`/inquiries/new?post=${post.id}`}
                    className="btn-primary btn-lg mt-5 w-full"
                  >
                    {t.post.inquire}
                  </Link>
                )
              ) : !isMember ? (
                <Link href="/signup" className="btn-primary btn-lg mt-5 w-full">
                  {t.common.signUp}
                </Link>
              ) : null}
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
