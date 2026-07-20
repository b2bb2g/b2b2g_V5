import Link from "next/link";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { SafeImage } from "@/components/ui/SafeImage";
import { POST_STATUS, type Locale } from "@/lib/constants";
import { repThumbnail } from "@/lib/media";
import { stripRichText } from "@/lib/richtext-text";
import type { PostTeaser } from "@/lib/types";

function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function RequestMark() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3h10a2 2 0 0 1 2 2v14l-4-3H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M8.5 8.5h7M8.5 12h4.5" />
    </svg>
  );
}

export function RequestBoardCard({
  post,
  href,
  locale,
  openLabel,
  closedLabel,
  openEndedLabel,
  deadlineLabel,
}: {
  post: PostTeaser;
  href: string;
  locale: Locale;
  openLabel: string;
  closedLabel: string;
  openEndedLabel: string;
  deadlineLabel: string;
}) {
  const thumbnail = repThumbnail(post);
  const title =
    locale === "ko" && post.title_ko ? post.title_ko : post.title_en;
  const teaser = stripRichText(
    locale === "ko" && post.body_teaser_ko
      ? post.body_teaser_ko
      : post.body_teaser_en,
  );
  const today = new Date().toISOString().slice(0, 10);
  const closed =
    post.status === POST_STATUS.CLOSED ||
    !!(post.deadline && post.deadline < today);

  return (
    <Link
      href={href}
      className="store-card-interactive group grid overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_40px_rgba(25,31,40,.07)] ring-1 ring-black/[.035] sm:min-h-[17rem] sm:grid-cols-[minmax(0,1fr)_13rem]"
    >
      <span className="flex min-w-0 flex-col p-5 sm:p-7">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              closed
                ? "bg-surface-sub text-ink-faint"
                : "bg-positive-soft text-positive"
            }`}
          >
            {closed
              ? closedLabel
              : post.deadline
                ? openLabel
                : openEndedLabel}
          </span>
          {!closed && post.deadline && (
            <span className="rounded-full bg-caution-soft px-2.5 py-1 text-xs font-bold text-caution">
              {deadlineLabel} {post.deadline}
            </span>
          )}
        </span>
        <strong className="mt-3.5 line-clamp-2 text-lg sm:mt-5 sm:text-2xl font-semibold leading-[1.13] tracking-[-.03em] text-ink transition-colors group-hover:text-primary">
          {title}
        </strong>
        <span className="mt-2.5 line-clamp-2 text-sm leading-6 text-ink-soft sm:mt-3 sm:line-clamp-3">
          {teaser}
        </span>
        <span className="mt-auto flex items-end justify-between gap-4 pt-5 sm:pt-7">
          <AuthorIdentity
            uid={post.author_uid}
            badges={post.author_badges}
            locale={locale}
            className="min-w-0 text-xs font-semibold text-ink-faint"
          />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-ink transition-colors group-hover:bg-primary group-hover:text-white">
            <Arrow />
          </span>
        </span>
      </span>

      <span className="relative hidden overflow-hidden bg-primary-soft sm:block sm:min-h-full">
        {thumbnail ? (
          <SafeImage
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 208px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <span className="flex h-full min-h-48 flex-col items-center justify-center bg-[linear-gradient(145deg,#e8f3ff_0%,#f5f7fb_55%,#e9eef5_100%)] text-primary sm:min-h-full">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/80 shadow-sm">
              <RequestMark />
            </span>
            <span className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-primary/70">
              RFQ · ITB
            </span>
          </span>
        )}
      </span>
    </Link>
  );
}

export function EditorialFeatureCard({
  post,
  href,
  locale,
  eyebrow,
  showDate = false,
}: {
  post: PostTeaser;
  href: string;
  locale: Locale;
  eyebrow: string;
  showDate?: boolean;
}) {
  const thumbnail = repThumbnail(post);
  const title =
    locale === "ko" && post.title_ko ? post.title_ko : post.title_en;
  const teaser = stripRichText(
    locale === "ko" && post.body_teaser_ko
      ? post.body_teaser_ko
      : post.body_teaser_en,
  );

  // No image: a text-forward hero (no empty photo panel). Soft glows and a
  // faint watermark give it presence so an announcement reads as intentional.
  if (!thumbnail) {
    return (
      <Link
        href={href}
        className="store-card-interactive group relative block min-h-[18rem] overflow-hidden rounded-[2rem] bg-[#101923] p-7 text-white shadow-[0_24px_70px_rgba(16,25,35,.18)] sm:min-h-[20rem] sm:p-10 lg:p-12"
      >
        <span
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-28 -left-12 h-72 w-72 rounded-full bg-[#79b4ff]/12 blur-3xl"
          aria-hidden="true"
        />
        <svg
          className="pointer-events-none absolute -right-6 bottom-2 h-40 w-40 text-white/[.04] sm:h-52 sm:w-52"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6 17h3l2-4V7H5v6h3l-2 4Zm8 0h3l2-4V7h-6v6h3l-2 4Z" />
        </svg>
        <span className="relative flex h-full min-h-[14rem] flex-col justify-between sm:min-h-[15rem]">
          <span>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#79b4ff]">
              {eyebrow}
            </span>
            <strong className="mt-5 block max-w-3xl text-3xl font-semibold leading-[1.06] tracking-[-.04em] sm:text-[2.75rem]">
              {title}
            </strong>
            {teaser && (
              <span className="mt-5 block line-clamp-3 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                {teaser}
              </span>
            )}
          </span>
          <span className="mt-9 flex items-center justify-between gap-5 border-t border-white/15 pt-6">
            <span className="text-sm font-semibold tabular-nums text-white/60">
              {showDate ? post.published_at?.slice(0, 10) : eyebrow}
            </span>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1">
              <Arrow />
            </span>
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="store-card-interactive group grid min-h-[28rem] overflow-hidden rounded-[2rem] bg-[#101923] text-white shadow-[0_24px_70px_rgba(16,25,35,.18)] lg:grid-cols-[.9fr_1.1fr]"
    >
      <span className="relative z-10 flex min-w-0 flex-col justify-between p-7 sm:p-10 lg:p-12">
        <span>
          <span className="text-xs font-bold uppercase tracking-[.18em] text-[#79b4ff]">
            {eyebrow}
          </span>
          <strong className="mt-5 block max-w-xl text-3xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-5xl">
            {title}
          </strong>
          <span className="mt-5 block line-clamp-4 max-w-xl text-sm leading-7 text-white/68 sm:text-base">
            {teaser}
          </span>
        </span>
        <span className="mt-9 flex items-center justify-between gap-5 border-t border-white/15 pt-6">
          {showDate ? (
            <span className="text-sm font-semibold tabular-nums text-white/60">
              {post.published_at?.slice(0, 10)}
            </span>
          ) : (
            <span className="text-sm font-semibold text-white/60">
              {eyebrow}
            </span>
          )}
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1">
            <Arrow />
          </span>
        </span>
      </span>
      <span className="relative min-h-72 overflow-hidden bg-[#172331] lg:min-h-full">
        {thumbnail ? (
          <SafeImage
            src={thumbnail}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <MediaPlaceholder className="bg-[linear-gradient(145deg,#15263a,#0e1721)]" />
        )}
        <span
          className="absolute inset-0 bg-gradient-to-r from-[#101923]/80 via-transparent to-transparent max-lg:bg-gradient-to-t max-lg:from-[#101923]/35 max-lg:to-transparent"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

export function EditorialListCard({
  post,
  href,
  locale,
  showDate = false,
}: {
  post: PostTeaser;
  href: string;
  locale: Locale;
  showDate?: boolean;
}) {
  const thumbnail = repThumbnail(post);
  const title =
    locale === "ko" && post.title_ko ? post.title_ko : post.title_en;
  const teaser = stripRichText(
    locale === "ko" && post.body_teaser_ko
      ? post.body_teaser_ko
      : post.body_teaser_en,
  );

  return (
    <Link
      href={href}
      className={`store-card-interactive group flex min-h-40 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_35px_rgba(25,31,40,.055)] ring-1 ring-black/[.035] ${
        thumbnail ? "" : "border-l-[3px] border-primary/25"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        {showDate && (
          <span className="text-xs font-semibold tabular-nums text-ink-faint">
            {post.published_at?.slice(0, 10)}
          </span>
        )}
        <strong
          className={`${showDate ? "mt-3" : ""} line-clamp-2 text-lg font-semibold leading-6 tracking-[-.02em] text-ink transition-colors group-hover:text-primary`}
        >
          {title}
        </strong>
        {teaser && (
          <span
            className={`mt-2 text-sm leading-6 text-ink-soft ${thumbnail ? "line-clamp-2" : "line-clamp-3"}`}
          >
            {teaser}
          </span>
        )}
        <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-semibold text-ink-faint transition-colors group-hover:text-primary">
          <span className="transition-transform group-hover:translate-x-0.5">
            <Arrow />
          </span>
        </span>
      </span>
      {thumbnail && (
        <span className="relative hidden w-40 shrink-0 overflow-hidden bg-surface-sub sm:block lg:w-44">
          <SafeImage
            src={thumbnail}
            alt=""
            fill
            sizes="176px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        </span>
      )}
    </Link>
  );
}
