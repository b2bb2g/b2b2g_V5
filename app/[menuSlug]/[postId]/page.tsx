import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getMenuBySlug, menuTitle } from "@/lib/data/menus";
import { getFullPost, getPostTeaser, listRelatedPosts } from "@/lib/data/posts";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import { postMediaUrl, repThumbnail, videoEmbedUrl } from "@/lib/media";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EventCard } from "@/components/marketplace/EventCard";
import { RequestDetail } from "@/components/marketplace/RequestDetail";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { MediaGallery } from "@/components/post/MediaGallery";
import { RichContentViewer } from "@/components/post/RichContentViewer";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { BOARD_TYPES, POST_STATUS, SETTING_KEYS } from "@/lib/constants";
import { isRichText, sanitizeRichText, stripRichText } from "@/lib/richtext";
import {
  eventStatus,
  eventCountdown,
  formatEventRange,
  type EventStatus,
} from "@/lib/events";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(props: {
  params: Promise<{ menuSlug: string; postId: string }>;
}): Promise<Metadata> {
  const { menuSlug, postId } = await props.params;
  const [teaser, menu] = await Promise.all([
    getPostTeaser(postId),
    getMenuBySlug(menuSlug),
  ]);
  if (!teaser || !menu || teaser.menu_id !== menu.id) return {};
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
  // Any notice-type board (notices, services, FAQ) reads as an article, not a
  // product — full content is public and there is no media/inquiry column.
  const isNotice = menu.board_type === BOARD_TYPES.NOTICE;
  const autoplay = settingBool(settings, SETTING_KEYS.VIDEO_AUTOPLAY, false);

  // Members read the full row through RLS; visitors only ever receive the
  // teaser view. The fade below is presentation; the data is truly absent.
  const full = isMember || isNotice ? await getFullPost(postId) : null;
  const teaser = full ? null : await getPostTeaser(postId);
  if (!full && !teaser) notFound();
  const postMenuId = full?.post.menu_id ?? teaser?.menu_id;
  if (postMenuId !== menu.id) notFound();

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
  // Keyed on board type, not slug, so new boards inherit the right behavior:
  // notice boards are the only ones without the inquiry flow.
  const inquiryEligible = menu.board_type !== BOARD_TYPES.NOTICE;
  const isEvent = menu.board_type === BOARD_TYPES.FLEXIBLE;
  const isCommerceProduct = menu.board_type === BOARD_TYPES.PRODUCT;

  // Event schedule (flexible board): shown instead of the author identity.
  const eventStart = post?.event_start ?? teaser?.event_start ?? null;
  const eventEnd = post?.event_end ?? teaser?.event_end ?? null;
  const eventVenue = post?.event_venue ?? teaser?.event_venue ?? null;
  const evStatus: EventStatus | null = isEvent
    ? eventStatus(eventStart, eventEnd)
    : null;
  const evRange = isEvent ? formatEventRange(eventStart, eventEnd, locale) : null;
  const evCountdown =
    isEvent && evStatus === "upcoming" && eventStart
      ? eventCountdown(eventStart)
      : null;
  const evStatusText: Record<EventStatus, string> = {
    ongoing: t.board.eventNowOn,
    upcoming: t.board.eventUpcomingLabel,
    ended: t.board.eventEnded,
  };
  const evStatusPill: Record<EventStatus, string> = {
    ongoing: "bg-positive-soft text-positive",
    upcoming: "bg-primary-soft text-primary-strong",
    ended: "bg-surface-sub text-ink-faint",
  };

  const statusLabels: Record<string, string> = t.post.status;
  const authorUid = full?.author?.uid ?? teaser?.author_uid;
  if (!authorUid) notFound();
  const authorBadges = full?.author?.badges ?? teaser?.author_badges ?? [];
  const inquiryPath = `/inquiries/new?post=${postId}`;
  const sectionTitle = menuTitle(menu, locale);
  const publishedAt =
    post?.published_at ??
    teaser?.published_at ??
    post?.created_at ??
    teaser?.created_at;
  const relatedProducts = isCommerceProduct
    ? await listRelatedPosts(menu.id, postId, 8)
    : [];
  const relatedRequests = isRequest
    ? await listRelatedPosts(menu.id, postId, 4)
    : [];
  // Other events for the detail footer, ordered live -> upcoming -> past.
  const relatedEvents = isEvent
    ? (await listRelatedPosts(menu.id, postId, 6))
        .map((ev) => ({ ev, status: eventStatus(ev.event_start, ev.event_end) }))
        .sort((a, b) => {
          const rank = (s: EventStatus | null) =>
            s === "ongoing" ? 0 : s === "upcoming" ? 1 : 2;
          const r = rank(a.status) - rank(b.status);
          if (r !== 0) return r;
          const sa = a.ev.event_start ?? a.ev.event_end ?? "9999-12-31";
          const sb = b.ev.event_start ?? b.ev.event_end ?? "9999-12-31";
          return sa < sb ? -1 : sa > sb ? 1 : 0;
        })
        .slice(0, 3)
    : [];
  const schemaBody = stripRichText(
    locale === "ko"
      ? (post?.body_ko ?? teaser?.body_teaser_ko ?? post?.body_en ?? teaser?.body_teaser_en ?? "")
      : (post?.body_en ?? teaser?.body_teaser_en ?? ""),
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  const schemaData = {
    "@context": "https://schema.org",
    "@type": isCommerceProduct ? "Product" : "Article",
    ...(isCommerceProduct ? { name: title } : { headline: title }),
    description: schemaBody,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/${menu.slug}/${postId}`,
    ...(repImage ? { image: postMediaUrl(repImage) } : {}),
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    author: { "@type": "Organization", name: `UID:${authorUid}` },
  };

  if (isRequest) {
    return (
      <>
        <JsonLd data={schemaData} />
        <RequestDetail
          menuSlug={menu.slug}
          sectionTitle={sectionTitle}
          postId={postId}
          title={title ?? ""}
          full={full}
          teaser={teaser}
          isOwn={isOwn}
          isMember={isMember}
          isClosed={isClosed}
          authorUid={authorUid}
          authorBadges={authorBadges}
          inquiryPath={inquiryPath}
          statusLabels={statusLabels}
          galleryImages={galleryImages}
          heroIndex={heroIndex}
          embed={embed}
          videoIsHero={videoIsHero}
          relatedRequests={relatedRequests}
        />
      </>
    );
  }

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
        <JsonLd data={schemaData} />
        <nav aria-label={t.board.backToNotices}>
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft transition hover:text-primary"
          >
            <span aria-hidden="true">←</span>
            {t.board.backToNotices}
          </Link>
        </nav>
        <div className="w-full overflow-hidden rounded-[2rem] border border-line/80 bg-white shadow-[0_20px_65px_rgba(25,31,40,.08)]">
          <header className="px-6 py-7 sm:px-10 sm:py-8 lg:px-14">
            <h1 className="text-3xl font-extrabold leading-tight tracking-[-.04em] text-ink sm:text-4xl">
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
            <div className="relative aspect-[16/7] overflow-hidden bg-surface-sub sm:aspect-[16/5]">
              <Image
                src={noticeImage}
                alt=""
                fill
                priority
                sizes="(max-width:1280px) 100vw, 1280px"
                className="object-cover"
              />
            </div>
          )}
          <section className="border-t border-line px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            <div className="mx-auto max-w-4xl">
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
            </div>
          </section>
        </div>
        {(previousNotice || nextNotice) && (
          <nav
            className="grid w-full overflow-hidden rounded-[1.5rem] border border-line/80 bg-white shadow-(--shadow-card) sm:grid-cols-2 sm:divide-x sm:divide-line"
            aria-label={t.board.relatedNotices}
          >
            {previousNotice ? (
              <Link
                href={`/notices/${previousNotice.id}`}
                className="group px-5 py-4 transition hover:bg-surface-sub"
              >
                <span className="text-xs font-bold text-ink-faint">
                  ← {t.board.previousNotice}
                </span>
                <strong className="mt-1.5 block line-clamp-1 text-sm font-extrabold group-hover:text-primary">
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
                className="group border-t border-line px-5 py-4 text-right transition hover:bg-surface-sub sm:border-t-0"
              >
                <span className="text-xs font-bold text-ink-faint">
                  {t.board.nextNotice} →
                </span>
                <strong className="mt-1.5 block line-clamp-1 text-sm font-extrabold group-hover:text-primary">
                  {locale === "ko" && nextNotice.title_ko
                    ? nextNotice.title_ko
                    : nextNotice.title_en}
                </strong>
              </Link>
            )}
          </nav>
        )}
        {relatedNotices.length > 0 && (
          <section className="w-full pb-3 pt-5">
            <h2 className="text-xl font-extrabold">{t.board.relatedNotices}</h2>
            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-line/80 bg-white shadow-(--shadow-card)">
              {relatedNotices.map((item) => {
                const thumbnail = repThumbnail(item);
                return (
                  <Link
                    key={item.id}
                    href={`/notices/${item.id}`}
                    className={`group grid items-center gap-4 border-b border-line px-5 py-4 transition last:border-b-0 hover:bg-surface-sub ${thumbnail ? "grid-cols-[1fr_6rem_auto]" : "grid-cols-[1fr_auto]"}`}
                  >
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

  if (isCommerceProduct) {
    const body = full
      ? locale === "ko" && full.post.body_ko
        ? full.post.body_ko
        : full.post.body_en
      : locale === "ko" && teaser?.body_teaser_ko
        ? teaser.body_teaser_ko
        : (teaser?.body_teaser_en ?? "");
    const summary = stripRichText(body).replace(/\s+/g, " ").trim();
    const highlightedSpecs = full?.specs.slice(0, 4) ?? [];
    const commerceImages =
      galleryImages.length > 0
        ? galleryImages
        : repImage
          ? [postMediaUrl(repImage)]
          : [];

    return (
      <>
        <article className="wide space-y-6 pb-16">
        <JsonLd data={schemaData} />
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

        <nav aria-label={t.post.backToList}>
          <Link
            href={`/${menu.slug}`}
            className="group inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-sm font-bold text-ink-soft transition hover:text-primary"
          >
            <span
              aria-hidden="true"
              className="transition-transform group-hover:-translate-x-1"
            >
              ←
            </span>
            {t.post.backToList.replace("{menu}", sectionTitle)}
          </Link>
        </nav>

        <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(21rem,.78fr)] lg:gap-5">
          <div className="min-w-0 overflow-hidden rounded-[1.75rem] border border-line/80 bg-white p-3 shadow-(--shadow-card) sm:p-4">
              {commerceImages.length > 0 || embed ? (
                <MediaGallery
                  images={commerceImages}
                  heroIndex={Math.min(heroIndex, commerceImages.length - 1)}
                  showHero
                  title={title ?? ""}
                  closeLabel={t.common.close}
                  variant="commerce"
                  videoSrc={embed}
                  videoLabel={t.post.video}
                  initialMedia={videoIsHero ? "video" : "image"}
                  previousLabel={t.post.previousMedia}
                  nextLabel={t.post.nextMedia}
                />
              ) : (
                <div className="aspect-square overflow-hidden rounded-[1.5rem] bg-surface-sub">
                  <MediaPlaceholder />
                </div>
              )}
          </div>

          <header className="flex min-w-0 flex-col rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-8 lg:min-h-full">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                    {sectionTitle}
                  </span>
                </div>
                <h1 className="mt-5 text-3xl font-extrabold leading-[1.2] tracking-[-.04em] text-ink sm:text-4xl lg:text-[2.5rem]">
                  {title}
                </h1>
                <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-line pb-5 text-sm text-ink-soft">
                  <span className="sr-only">{t.post.postedBy}</span>
                  <AuthorIdentity
                    uid={authorUid}
                    badges={authorBadges}
                    locale={locale}
                    linked
                  />
                </div>

                {summary && (
                  <p className="mt-5 line-clamp-4 text-sm leading-7 text-ink-soft">
                    {summary}
                  </p>
                )}

                {highlightedSpecs.length > 0 && (
                  <section className="mt-6 rounded-2xl bg-surface-sub/80 p-4">
                    <h2 className="text-xs font-extrabold uppercase tracking-[.12em] text-ink-faint">
                      {t.post.keySpecifications}
                    </h2>
                    <dl className="mt-3 divide-y divide-line/80">
                      {highlightedSpecs.map((spec) => (
                        <div
                          key={spec.id}
                          className="grid grid-cols-[minmax(6rem,.8fr)_1.2fr] gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                        >
                          <dt className="font-semibold text-ink-faint">
                            {locale === "ko" && spec.name_ko
                              ? spec.name_ko
                              : spec.name_en}
                          </dt>
                          <dd className="text-right font-bold text-ink">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}

                <ul className="mt-6 grid gap-2 text-xs font-semibold text-ink-soft sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    t.post.publicUidIdentity,
                    t.post.linkedInquiry,
                    t.post.memberDetailAccess,
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive-soft text-[11px] font-black text-positive"
                      >
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-8">
                <div className="rounded-2xl border border-primary/15 bg-primary-soft/55 p-4">
                  <p className="text-sm font-extrabold text-ink">
                    {t.post.requestProductDetails}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">
                    {t.post.productInquiryHint}
                  </p>
                </div>
                {isOwn && post ? (
                  <Link
                    href={`/write?menu=${menu.slug}&post=${postId}`}
                    className="btn-secondary btn-lg mt-3 w-full"
                  >
                    {t.post.editPost}
                  </Link>
                ) : isMember && post?.status === POST_STATUS.APPROVED ? (
                  <Link
                    href={inquiryPath}
                    className="btn-primary btn-lg mt-3 w-full"
                  >
                    {t.post.inquire}
                  </Link>
                ) : !isMember ? (
                  <Link
                    href={`/login?next=${encodeURIComponent(inquiryPath)}`}
                    className="btn-primary btn-lg mt-3 w-full"
                  >
                    {t.post.inquire}
                  </Link>
                ) : null}
              </div>
            </header>
        </section>

        <nav
          aria-label={t.post.detailNavigation}
          className="scrollbar-none sticky top-16 z-20 -mx-1 flex overflow-x-auto border-b border-line bg-[#f7f8fa]/95 px-1 pt-1 backdrop-blur sm:top-18"
        >
          <a
            href="#product-overview"
            className="shrink-0 border-b-2 border-ink px-5 py-4 text-sm font-extrabold text-ink"
          >
            {t.post.productInformation}
          </a>
          {full && full.specs.length > 0 && (
            <a
              href="#product-specifications"
              className="shrink-0 border-b-2 border-transparent px-5 py-4 text-sm font-bold text-ink-faint transition hover:text-ink"
            >
              {t.post.specs}
            </a>
          )}
          {full && full.attachments.length > 0 && (
            <a
              href="#product-attachments"
              className="shrink-0 border-b-2 border-transparent px-5 py-4 text-sm font-bold text-ink-faint transition hover:text-ink"
            >
              {t.post.attachments}
            </a>
          )}
          {relatedProducts.length > 0 && (
            <a
              href="#related-products"
              className="shrink-0 border-b-2 border-transparent px-5 py-4 text-sm font-bold text-ink-faint transition hover:text-ink"
            >
              {t.post.relatedProducts}
            </a>
          )}
        </nav>

        {full ? (
          <section
            id="product-overview"
            className="w-full scroll-mt-32 overflow-hidden rounded-[2rem] border border-line/80 bg-white shadow-[0_20px_65px_rgba(25,31,40,.08)]"
          >
            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
              <div className="mx-auto max-w-4xl">
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                  {t.post.productInformation}
                </p>
                <div className="mt-6">
                  {isRichText(body) ? (
                    <RichContentViewer
                      html={sanitizeRichText(body)}
                      title={title ?? ""}
                      closeLabel={t.common.close}
                      className="rich-content product-rich-content"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-base leading-8 text-ink-soft">
                      {body}
                    </div>
                  )}
                </div>

                {full.specs.length > 0 && (
                  <div
                    id="product-specifications"
                    className="mt-10 scroll-mt-32 border-t border-line pt-8"
                  >
                    <h2 className="text-xl font-extrabold tracking-[-.02em]">
                      {t.post.specs}
                    </h2>
                    <dl className="mt-5 grid overflow-hidden rounded-2xl border border-line sm:grid-cols-2">
                      {full.specs.map((spec) => (
                        <div
                          key={spec.id}
                          className="border-b border-line p-4 last:border-b-0 sm:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(2n)]:border-r-0"
                        >
                          <dt className="text-xs font-bold text-ink-faint">
                            {locale === "ko" && spec.name_ko
                              ? spec.name_ko
                              : spec.name_en}
                          </dt>
                          <dd className="mt-1.5 text-sm font-semibold leading-6 text-ink">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {full.attachments.length > 0 && (
                  <div
                    id="product-attachments"
                    className="mt-10 scroll-mt-32 border-t border-line pt-8"
                  >
                    <h2 className="text-xl font-extrabold tracking-[-.02em]">
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
                              aria-hidden="true"
                              className="ml-4 text-primary transition-transform group-hover:translate-y-0.5"
                            >
                              ↓
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          teaser && (
            <section className="w-full overflow-hidden rounded-[2rem] border border-line/80 bg-white shadow-[0_20px_65px_rgba(25,31,40,.08)]">
              <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
                <div className="mx-auto max-w-4xl">
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                    {t.post.productInformation}
                  </p>
                  <div className="teaser-fade mt-6 whitespace-pre-wrap text-base leading-8 text-ink-soft">
                    {summary}
                  </div>
                  <div className="mt-8 rounded-2xl bg-surface-sub p-6 text-center">
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
                </div>
              </div>
            </section>
          )
        )}

        {relatedProducts.length > 0 && (
          <section id="related-products" className="scroll-mt-32 pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                  {sectionTitle}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-.03em] sm:text-3xl">
                  {t.post.relatedProducts}
                </h2>
              </div>
              <Link
                href={`/${menu.slug}`}
                className="shrink-0 text-sm font-bold text-primary hover:text-primary-strong"
              >
                {t.common.viewAll} →
              </Link>
            </div>
            <div className="scrollbar-none -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-6">
              {relatedProducts.map((related) => (
                <div
                  key={related.id}
                  className="w-[72vw] max-w-64 shrink-0 snap-start sm:w-60"
                >
                  <ProductCard
                    post={related}
                    href={`/${menu.slug}/${related.id}`}
                    locale={locale}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
        </article>
        {!isOwn && (
          <div className="mobile-sticky-action fixed inset-x-4 bottom-4 z-40 mx-0 w-auto max-w-none lg:hidden">
            <Link
              href={isMember ? inquiryPath : `/login?next=${encodeURIComponent(inquiryPath)}`}
              className="btn-primary btn-lg w-full shadow-[0_14px_40px_rgba(28,101,220,.35)]"
            >
              {t.post.inquire}
            </Link>
          </div>
        )}
      </>
    );
  }

  return (
    <article className="wide space-y-5 pb-16 sm:space-y-6">
      <JsonLd data={schemaData} />
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

      <nav aria-label={t.post.backToList}>
        <Link
          href={`/${menu.slug}`}
          className="group inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-sm font-bold text-ink-soft transition hover:text-primary"
        >
          <span
            aria-hidden="true"
            className="transition-transform group-hover:-translate-x-1"
          >
            ←
          </span>
          {t.post.backToList.replace("{menu}", sectionTitle)}
        </Link>
      </nav>

      <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,.75fr)] lg:gap-5">
        <div className="min-w-0 overflow-hidden rounded-[1.75rem] border border-line/80 bg-white shadow-(--shadow-card)">
          {/* Representative media: player on detail only (PRD 6.8) */}
          {videoIsHero ? (
            <div className="space-y-2 p-2">
              <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-surface-sub sm:aspect-video lg:aspect-[4/3]">
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
            <div className="space-y-2 p-2">
              {galleryImages.length > 0 ? (
                <MediaGallery
                  images={galleryImages}
                  heroIndex={heroIndex}
                  showHero
                  title={title ?? ""}
                  closeLabel={t.common.close}
                />
              ) : (
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-surface-sub sm:aspect-video lg:aspect-[4/3]">
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
                <div className="aspect-video overflow-hidden rounded-[1.25rem] bg-surface-sub">
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
          ) : (
            <div className="aspect-[4/3] overflow-hidden bg-surface-sub sm:aspect-video lg:aspect-[4/3]">
              <MediaPlaceholder />
            </div>
          )}
        </div>

        <header className="flex min-w-0 flex-col rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-8 lg:min-h-full">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                {sectionTitle}
              </span>
              {publishedAt && (
                <time
                  dateTime={publishedAt}
                  className="text-xs font-semibold text-ink-faint"
                >
                  {publishedAt.slice(0, 10)}
                </time>
              )}
            </div>
            <h1 className="mt-5 text-2xl font-extrabold leading-[1.25] tracking-[-.035em] text-ink sm:text-3xl lg:text-[2rem]">
              {title}
            </h1>
            {isEvent ? (
              <div className="mt-5 border-t border-line pt-5">
                {evStatus && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${evStatusPill[evStatus]}`}
                    >
                      {evStatus === "ongoing" && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-70" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
                        </span>
                      )}
                      {evStatusText[evStatus]}
                    </span>
                    {evCountdown && (
                      <span className="rounded-full bg-caution-soft px-2.5 py-1 text-xs font-bold tabular-nums text-caution">
                        {evCountdown}
                      </span>
                    )}
                  </div>
                )}
                <dl className="mt-4 space-y-3 text-sm">
                  {evRange && (
                    <div className="flex items-start gap-3">
                      <dt className="w-16 shrink-0 font-semibold text-ink-faint">
                        {t.board.eventScheduleLabel}
                      </dt>
                      <dd className="font-bold text-ink">{evRange}</dd>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <dt className="w-16 shrink-0 font-semibold text-ink-faint">
                      {t.board.eventVenueLabel}
                    </dt>
                    <dd className="font-bold text-ink">
                      {eventVenue ?? t.board.eventVenueTbd}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5 text-sm text-ink-soft">
                <span className="sr-only">{t.post.postedBy}</span>
                <AuthorIdentity
                  uid={authorUid}
                  badges={authorBadges}
                  locale={locale}
                  linked
                />
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
            )}
          </div>

          <div className="mt-auto pt-8">
            {isOwn && post ? (
              <Link
                href={`/write?menu=${menu.slug}&post=${postId}`}
                className="btn-secondary btn-lg w-full"
              >
                {t.post.editPost}
              </Link>
            ) : inquiryEligible ? (
              isClosed && isRequest ? (
                <button
                  disabled
                  className="w-full rounded-xl bg-surface-sub px-5 py-3.5 text-sm font-bold text-ink-faint"
                >
                  {t.post.closed}
                </button>
              ) : isMember && post?.status === POST_STATUS.APPROVED ? (
                <Link href={inquiryPath} className="btn-primary btn-lg w-full">
                  {t.post.inquire}
                </Link>
              ) : !isMember ? (
                <Link
                  href={`/login?next=${encodeURIComponent(inquiryPath)}`}
                  className="btn-primary btn-lg w-full"
                >
                  {t.post.inquire}
                </Link>
              ) : null
            ) : null}
            {inquiryEligible && !isOwn && !(isClosed && isRequest) && (
              <p className="mt-3 text-center text-xs leading-5 text-ink-faint">
                {isEvent ? t.post.eventInquiryHint : t.post.directInquiryHint}
              </p>
            )}
          </div>
        </header>
      </section>

      {!isEvent && full && (full.specs.length > 0 || full.attachments.length > 0) && (
        <nav
          aria-label={t.post.detailNavigation}
          className="scrollbar-none flex gap-2 overflow-x-auto rounded-2xl border border-line/80 bg-white p-2 shadow-(--shadow-card)"
        >
          <a
            href="#overview"
            className="shrink-0 rounded-xl bg-[#101923] px-4 py-2.5 text-sm font-bold text-white"
          >
            {t.post.overview}
          </a>
          {full.specs.length > 0 && (
            <a
              href="#specifications"
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-surface-sub hover:text-ink"
            >
              {t.post.specs}
            </a>
          )}
          {full.attachments.length > 0 && (
            <a
              href="#attachments"
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-surface-sub hover:text-ink"
            >
              {t.post.attachments}
            </a>
          )}
        </nav>
      )}

      {isEvent ? (
        (() => {
          const evBody = full
            ? locale === "ko" && full.post.body_ko
              ? full.post.body_ko
              : full.post.body_en
            : locale === "ko" && teaser?.body_teaser_ko
              ? teaser.body_teaser_ko
              : (teaser?.body_teaser_en ?? "");
          const evTruncated = !full && !!teaser?.body_truncated;
          return (
            <>
              <section className="w-full overflow-hidden rounded-[2rem] border border-line/80 bg-white shadow-[0_20px_65px_rgba(25,31,40,.08)]">
                <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
                  <div className="mx-auto max-w-4xl">
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                      {t.board.aboutEvent}
                    </p>
                    {full ? (
                      isRichText(evBody) ? (
                        <div
                          className="rich-content notice-content mt-6"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichText(evBody),
                          }}
                        />
                      ) : (
                        <div className="mt-6 whitespace-pre-wrap text-base leading-8 text-ink-soft">
                          {evBody}
                        </div>
                      )
                    ) : (
                      <div
                        className={`mt-6 whitespace-pre-wrap text-base leading-8 text-ink-soft ${evTruncated ? "teaser-fade" : ""}`}
                      >
                        {stripRichText(evBody)}
                      </div>
                    )}
                    {full && full.attachments.length > 0 && (
                      <div className="mt-10 border-t border-line pt-8">
                        <h2 className="text-base font-extrabold">
                          {t.post.attachments}
                        </h2>
                        <ul className="mt-4 space-y-2">
                          {full.attachments.map((a) => (
                            <li key={a.id}>
                              <Link
                                href={`/api/attachments/${a.id}`}
                                className="group flex items-center justify-between rounded-2xl bg-surface-sub px-4 py-3.5 text-sm font-bold text-ink transition hover:bg-primary-soft hover:text-primary-strong"
                              >
                                <span className="min-w-0 truncate">
                                  {a.filename}
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="ml-4 text-primary transition-transform group-hover:translate-y-0.5"
                                >
                                  ↓
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {evTruncated && (
                      <div className="mt-8 rounded-2xl bg-surface-sub p-6 text-center">
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
                    )}
                  </div>
                </div>
              </section>

              {relatedEvents.length > 0 && (
                <section className="pt-2">
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <h2 className="text-xl font-extrabold tracking-[-.02em] sm:text-2xl">
                      {t.board.moreEvents}
                    </h2>
                    <Link
                      href={`/${menu.slug}`}
                      className="shrink-0 text-sm font-bold text-primary hover:text-primary-strong"
                    >
                      {t.common.viewAll} →
                    </Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {relatedEvents.map(({ ev }) => (
                      <EventCard
                        key={ev.id}
                        post={ev}
                        href={`/${menu.slug}/${ev.id}`}
                        locale={locale}
                        labels={{
                          ongoing: t.board.eventNowOn,
                          upcoming: t.board.eventUpcomingLabel,
                          ended: t.board.eventEnded,
                          venueTbd: t.board.eventVenueTbd,
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          );
        })()
      ) : (
        <div className="mx-auto w-full max-w-5xl">
          <div className="min-w-0 space-y-5">
            {full ? (
              <>
                <section
                  id="overview"
                  className="scroll-mt-28 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-9"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                    {t.post.overview}
                  </p>
                  <div className="mt-5 max-w-[72ch]">
                    {(() => {
                      const body =
                        locale === "ko" && full.post.body_ko
                          ? full.post.body_ko
                          : full.post.body_en;
                      return isRichText(body) ? (
                        <div
                          className="rich-content"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichText(body),
                          }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-[15px] leading-8 text-ink-soft sm:text-base">
                          {body}
                        </div>
                      );
                    })()}
                  </div>
                </section>

                {full.specs.length > 0 && (
                <section
                  id="specifications"
                  className="scroll-mt-28 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-9"
                >
                  <h2 className="text-xl font-extrabold">{t.post.specs}</h2>
                  <dl className="mt-5 grid overflow-hidden rounded-2xl border border-line sm:grid-cols-2">
                    {full.specs.map((spec) => (
                      <div
                        key={spec.id}
                        className="border-b border-line p-4 last:border-b-0 sm:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(2n)]:border-r-0"
                      >
                        <dt className="text-xs font-bold text-ink-faint">
                          {locale === "ko" && spec.name_ko
                            ? spec.name_ko
                            : spec.name_en}
                        </dt>
                        <dd className="mt-1.5 text-sm font-semibold leading-6 text-ink">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {full.attachments.length > 0 && (
                <section
                  id="attachments"
                  className="scroll-mt-28 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-9"
                >
                  <h2 className="text-xl font-extrabold">
                    {t.post.attachments}
                  </h2>
                  <ul className="mt-5 overflow-hidden rounded-2xl border border-line">
                    {full.attachments.map((a) => (
                      <li
                        key={a.id}
                        className="border-b border-line last:border-b-0"
                      >
                        <Link
                          href={`/api/attachments/${a.id}`}
                          className="group flex items-center justify-between gap-4 px-4 py-4 text-sm font-bold text-ink transition hover:bg-primary-soft/40 hover:text-primary-strong"
                        >
                          <span className="min-w-0 truncate">{a.filename}</span>
                          <span
                            aria-hidden="true"
                            className="shrink-0 text-primary transition-transform group-hover:translate-y-0.5"
                          >
                            ↓
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : (
            teaser && (
              <section className="rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-9">
                {/* Gradient lock: only teaser data was ever sent to the client */}
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                  {t.post.overview}
                </p>
                <div className="teaser-fade mt-5 whitespace-pre-wrap text-[15px] leading-8 text-ink-soft sm:text-base">
                  {stripRichText(
                    locale === "ko" && teaser.body_teaser_ko
                      ? teaser.body_teaser_ko
                      : teaser.body_teaser_en,
                  )}
                </div>
                <div className="mt-6 rounded-2xl bg-surface-sub p-6 text-center">
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
              </section>
            )
          )}
          </div>
        </div>
      )}
    </article>
  );
}
