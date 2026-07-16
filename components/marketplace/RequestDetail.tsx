import Image from "next/image";
import Link from "next/link";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";
import { RequestBoardCard } from "@/components/marketplace/BoardContentCards";
import { MediaGallery } from "@/components/post/MediaGallery";
import { RichContentViewer } from "@/components/post/RichContentViewer";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { POST_STATUS } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { sanitizeRichText, isRichText, stripRichText } from "@/lib/richtext";
import type { FullPost } from "@/lib/data/posts";
import type { PostTeaser } from "@/lib/types";

type Badge = {
  code: string;
  name_en: string;
  name_ko: string;
};

type RequestDetailProps = {
  menuSlug: string;
  sectionTitle: string;
  postId: string;
  title: string;
  full: FullPost | null;
  teaser: PostTeaser | null;
  isOwn: boolean;
  isMember: boolean;
  isClosed: boolean;
  authorUid: number;
  authorBadges: Badge[];
  inquiryPath: string;
  statusLabels: Record<string, string>;
  galleryImages: string[];
  heroIndex: number;
  embed: string | null;
  videoIsHero: boolean;
  relatedRequests: PostTeaser[];
};

function CheckMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-positive-soft text-xs font-black text-positive"
    >
      ✓
    </span>
  );
}

function RequestMedia({
  galleryImages,
  heroIndex,
  embed,
  videoIsHero,
  title,
  closeLabel,
  previousLabel,
  nextLabel,
}: {
  galleryImages: string[];
  heroIndex: number;
  embed: string | null;
  videoIsHero: boolean;
  title: string;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  if (videoIsHero && embed) {
    return (
      <div className="space-y-2 p-2">
        <div className="aspect-video overflow-hidden rounded-[1.25rem] bg-[#101923]">
          <iframe
            src={embed}
            title={title}
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
            title={title}
            closeLabel={closeLabel}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
          />
        )}
      </div>
    );
  }

  if (galleryImages.length > 0) {
    return (
      <div className="space-y-2 p-2">
        <MediaGallery
          images={galleryImages}
          heroIndex={heroIndex}
          showHero
          title={title}
          closeLabel={closeLabel}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
        />
        {embed && (
          <div className="aspect-video overflow-hidden rounded-[1.25rem] bg-[#101923]">
            <iframe
              src={embed}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

export async function RequestDetail({
  menuSlug,
  sectionTitle,
  postId,
  title,
  full,
  teaser,
  isOwn,
  isMember,
  isClosed,
  authorUid,
  authorBadges,
  inquiryPath,
  statusLabels,
  galleryImages,
  heroIndex,
  embed,
  videoIsHero,
  relatedRequests,
}: RequestDetailProps) {
  const { t, locale } = await getT();
  const deadline = full?.post.deadline ?? teaser?.deadline ?? null;
  const requestBody = full
    ? locale === "ko" && full.post.body_ko
      ? full.post.body_ko
      : full.post.body_en
    : locale === "ko" && teaser?.body_teaser_ko
      ? teaser.body_teaser_ko
      : (teaser?.body_teaser_en ?? "");
  const summary = stripRichText(requestBody).replace(/\s+/g, " ").trim();
  const hasMedia = galleryImages.length > 0 || !!embed;
  const inquiryHref = isMember
    ? inquiryPath
    : `/login?next=${encodeURIComponent(inquiryPath)}`;

  const responseAction = isOwn && full?.post ? (
    <Link
      href={`/write?menu=${menuSlug}&post=${postId}`}
      className="btn-secondary btn-lg w-full"
    >
      {t.post.editPost}
    </Link>
  ) : isClosed ? (
    <button
      disabled
      className="w-full rounded-xl bg-white/10 px-5 py-3.5 text-sm font-bold text-white/45"
    >
      {t.post.closedForResponses}
    </button>
  ) : (
    <Link href={inquiryHref} className="btn-primary btn-lg w-full">
      {t.post.inquire}
    </Link>
  );

  const requestIdentity = (
    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
      <span className="sr-only">{t.post.postedBy}</span>
      <AuthorIdentity
        uid={authorUid}
        badges={authorBadges}
        locale={locale}
        linked
      />
    </div>
  );

  const requestStatus = (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${
        isClosed
          ? "bg-surface-sub text-ink-faint"
          : "bg-positive-soft text-positive"
      }`}
    >
      {!isClosed && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
        </span>
      )}
      {isClosed ? t.post.closedForResponses : t.post.openForResponses}
    </span>
  );

  return (
    <>
      <article
        className="wide space-y-5 pb-16 sm:space-y-6"
        data-request-detail
      >
        {isOwn &&
          full?.post &&
          full.post.status !== POST_STATUS.APPROVED && (
            <div className="flex items-center justify-between rounded-card border border-line bg-surface-sub/60 px-4 py-3">
              <StatusLabel
                status={full.post.status}
                label={
                  statusLabels[full.post.status] ?? full.post.status
                }
              />
              {full.post.status === POST_STATUS.REJECTED &&
                full.post.reject_reason && (
                  <p className="text-xs text-ink-soft">
                    {t.post.rejectionReason}: {full.post.reject_reason}
                  </p>
                )}
            </div>
          )}

        <nav aria-label={t.post.backToList}>
          <Link
            href={`/${menuSlug}`}
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

        {hasMedia ? (
          <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(21rem,.75fr)] lg:gap-5">
            <div
              className="min-w-0 overflow-hidden rounded-[1.75rem] border border-line/80 bg-white shadow-(--shadow-card)"
              data-request-media
            >
              <RequestMedia
                galleryImages={galleryImages}
                heroIndex={heroIndex}
                embed={embed}
                videoIsHero={videoIsHero}
                title={title}
                closeLabel={t.common.close}
                previousLabel={t.post.previousMedia}
                nextLabel={t.post.nextMedia}
              />
            </div>

            <header className="flex min-w-0 flex-col rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                  {t.post.sourcingRequest}
                </span>
                {requestStatus}
              </div>
              <h1 className="mt-5 text-3xl font-extrabold leading-[1.14] tracking-[-.04em] text-ink sm:text-4xl">
                {title}
              </h1>
              <div className="mt-5 border-t border-line pt-5">
                {requestIdentity}
              </div>
              {summary && (
                <p className="mt-5 line-clamp-4 text-sm leading-7 text-ink-soft">
                  {summary}
                </p>
              )}
              <dl className="mt-6 rounded-2xl bg-surface-sub/80 p-4">
                <div className="flex items-center justify-between gap-5">
                  <dt className="text-xs font-bold text-ink-faint">
                    {t.post.responseDeadline}
                  </dt>
                  <dd className="text-sm font-extrabold text-ink">
                    {deadline ?? t.post.openEnded}
                  </dd>
                </div>
              </dl>
              <div
                className={
                  isOwn ? "mt-auto pt-8" : "mt-auto hidden pt-8 lg:block"
                }
              >
                {responseAction}
              </div>
            </header>
          </section>
        ) : (
          <section
            className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(21rem,.65fr)] lg:gap-5"
            data-request-no-media
          >
            <header className="relative min-w-0 overflow-hidden rounded-[2rem] border border-primary/10 bg-[linear-gradient(145deg,#f8fbff_0%,#edf5ff_52%,#ffffff_100%)] p-7 shadow-[0_20px_65px_rgba(25,31,40,.08)] sm:p-10 lg:p-12">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-20 text-[16rem] font-black leading-none tracking-[-.1em] text-primary/[.045]"
              >
                RFQ
              </span>
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-extrabold uppercase tracking-[.16em] text-primary">
                    {sectionTitle}
                  </span>
                  {requestStatus}
                </div>
                <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-ink sm:text-5xl lg:text-[3.5rem]">
                  {title}
                </h1>
                {summary && (
                  <p className="mt-6 max-w-3xl line-clamp-3 text-base leading-8 text-ink-soft">
                    {summary}
                  </p>
                )}
                <div className="mt-8 border-t border-primary/10 pt-6">
                  {requestIdentity}
                </div>
              </div>
            </header>

            <aside className="flex min-w-0 flex-col rounded-[2rem] bg-[#101923] p-7 text-white shadow-[0_24px_70px_rgba(16,25,35,.2)] sm:p-9">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#79b4ff]">
                  {t.post.requestBrief}
                </p>
                <h2 className="mt-5 text-2xl font-extrabold leading-tight tracking-[-.035em]">
                  {isClosed
                    ? t.post.closedForResponses
                    : t.post.respondTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  {t.post.respondBody}
                </p>
                <dl className="mt-7 border-y border-white/12 py-5">
                  <div className="flex items-center justify-between gap-5">
                    <dt className="text-xs font-semibold text-white/48">
                      {t.post.responseDeadline}
                    </dt>
                    <dd className="text-sm font-extrabold">
                      {deadline ?? t.post.openEnded}
                    </dd>
                  </div>
                </dl>
              </div>
              <div
                className={
                  isOwn ? "mt-auto pt-8" : "mt-auto hidden pt-8 lg:block"
                }
              >
                {responseAction}
              </div>
            </aside>
          </section>
        )}

        {full && (full.specs.length > 0 || full.attachments.length > 0) && (
          <nav
            aria-label={t.post.detailNavigation}
            className="scrollbar-none flex gap-2 overflow-x-auto rounded-2xl border border-line/80 bg-white p-2 shadow-(--shadow-card)"
          >
            <a
              href="#request-overview"
              className="shrink-0 rounded-xl bg-[#101923] px-4 py-2.5 text-sm font-bold text-white"
            >
              {t.post.requestOverview}
            </a>
            {full.specs.length > 0 && (
              <a
                href="#request-requirements"
                className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-surface-sub hover:text-ink"
              >
                {t.post.requestRequirements}
              </a>
            )}
            {full.attachments.length > 0 && (
              <a
                href="#request-files"
                className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-surface-sub hover:text-ink"
              >
                {t.post.requestFiles}
              </a>
            )}
          </nav>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-5">
            <section
              id="request-overview"
              className="scroll-mt-28 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-9"
            >
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                {t.post.requestOverview}
              </p>
              <div className="mt-5 max-w-[72ch]">
                {full ? (
                  isRichText(requestBody) ? (
                    <RichContentViewer
                      html={sanitizeRichText(requestBody)}
                      title={title}
                      closeLabel={t.common.close}
                      className="rich-content"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-[15px] leading-8 text-ink-soft sm:text-base">
                      {requestBody}
                    </div>
                  )
                ) : (
                  <>
                    <div
                      className={`whitespace-pre-wrap text-[15px] leading-8 text-ink-soft sm:text-base ${
                        teaser?.body_truncated ? "teaser-fade" : ""
                      }`}
                    >
                      {summary}
                    </div>
                    <div className="mt-7 rounded-2xl bg-surface-sub p-6 text-center">
                      <p className="text-base font-extrabold text-ink">
                        {t.post.membersOnlyTitle}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">
                        {t.post.membersOnlyBody}
                      </p>
                      <Link
                        href="/signup"
                        className="btn-primary btn-lg mt-4 inline-flex"
                      >
                        {t.common.signUp}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </section>

            {full && full.specs.length > 0 && (
              <section
                id="request-requirements"
                className="scroll-mt-28 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-9"
              >
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                  {t.post.requestRequirements}
                </p>
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

            {full && full.attachments.length > 0 && (
              <section
                id="request-files"
                className="scroll-mt-28 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-9"
              >
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                  {t.post.requestFiles}
                </p>
                <ul className="mt-5 overflow-hidden rounded-2xl border border-line">
                  {full.attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="border-b border-line last:border-b-0"
                    >
                      <Link
                        href={`/api/attachments/${attachment.id}`}
                        className="group flex items-center justify-between gap-4 px-4 py-4 text-sm font-bold text-ink transition hover:bg-primary-soft/40 hover:text-primary-strong"
                      >
                        <span className="min-w-0 truncate">
                          {attachment.filename}
                        </span>
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
          </div>

          <aside className="rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) lg:sticky lg:top-24">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
              {t.post.beforeResponding}
            </p>
            <ul className="mt-5 space-y-4 text-sm font-semibold leading-6 text-ink-soft">
              {[
                t.post.responseCheckQuantity,
                t.post.responseCheckTiming,
                t.post.responseCheckPlatform,
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckMark />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {relatedRequests.length > 0 && (
          <section className="pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
                  {sectionTitle}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-.03em] sm:text-3xl">
                  {t.post.moreRequests}
                </h2>
              </div>
              <Link
                href={`/${menuSlug}`}
                className="shrink-0 text-sm font-bold text-primary hover:text-primary-strong"
              >
                {t.common.viewAll} →
              </Link>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {relatedRequests.map((request) => (
                <RequestBoardCard
                  key={request.id}
                  post={request}
                  href={`/${menuSlug}/${request.id}`}
                  locale={locale}
                  openLabel={t.post.open}
                  closedLabel={t.post.closed}
                  openEndedLabel={t.post.openEnded}
                  deadlineLabel={t.post.deadline}
                />
              ))}
            </div>
          </section>
        )}
      </article>

      {!isOwn && !isClosed && (
        <div className="mobile-sticky-action fixed inset-x-4 bottom-4 z-40 mx-0 w-auto max-w-none lg:hidden">
          <Link
            href={inquiryHref}
            className="btn-primary btn-lg w-full shadow-[0_14px_40px_rgba(28,101,220,.35)]"
          >
            {t.post.inquire}
          </Link>
        </div>
      )}
    </>
  );
}
