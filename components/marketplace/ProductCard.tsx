import Link from "next/link";
import { repThumbnail } from "@/lib/media";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { SafeImage } from "@/components/ui/SafeImage";
import type { PostTeaser } from "@/lib/types";
import { BadgePill } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/marketplace/BookmarkButton";
import { stripRichText } from "@/lib/richtext-text";

const FEATURE_BADGE_STYLES: Record<string, string> = {
  manufacturer: "border-[#5bd6ff] bg-[#c8f4ff] text-[#07506f]",
  certified: "border-[#54ef83] bg-[#c8ffd7] text-[#075c26]",
  coordinator: "border-[#ffdb45] bg-[#fff2a3] text-[#654900]",
};

// Two layouts share the trust data:
//  - `feature` (landing): a visual card using the same hierarchy as the
//    landing page's "How it works" family — badges, title and bottom summary.
//  - default (board grids): image tile with the title + author row below.
export function ProductCard({
  post,
  href,
  locale,
  priority = false,
  showAuthor = true,
  feature = false,
  compactFeature = false,
  bookmark,
}: {
  post: PostTeaser;
  href: string;
  locale: string;
  priority?: boolean;
  showAuthor?: boolean;
  feature?: boolean;
  compactFeature?: boolean;
  /** Signed-in grids show a heart overlay on the image tile. */
  bookmark?: {
    saved: boolean;
    returnTo: string;
    saveLabel: string;
    savedLabel: string;
  };
}) {
  const thumbnail = repThumbnail(post);
  const title =
    locale === "ko" && post.title_ko ? post.title_ko : post.title_en;
  const intro = stripRichText(
    locale === "ko" && post.body_teaser_ko
      ? post.body_teaser_ko
      : post.body_teaser_en,
  );

  if (feature) {
    return (
      <Link
        href={href}
        className="store-card-interactive group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white focus:outline-none"
      >
        <div className="absolute inset-0">
          {thumbnail ? (
            <SafeImage
              src={thumbnail}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 82vw, (max-width: 1024px) 25rem, 28rem"
              className="object-cover"
            />
          ) : (
            <MediaPlaceholder />
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/62 via-black/12 to-black/68" />

        <div className="relative z-10 flex h-full flex-col p-7">
          <div className="flex min-h-5 items-start gap-1.5 overflow-hidden">
            {post.author_badges.map((badge) => (
              <span
                key={badge.code}
                className={`inline-flex shrink-0 rounded-full border px-2.5 py-px text-xs font-bold leading-4 shadow-[0_3px_14px_rgba(0,0,0,.18),inset_0_0_0_1px_rgba(255,255,255,.58)] ${FEATURE_BADGE_STYLES[badge.code] ?? "border-[#d7f43f] bg-[#efff92] text-[#3b4b00]"}`}
              >
                {locale === "ko" ? badge.name_ko : badge.name_en}
              </span>
            ))}
          </div>
          <h3
            className={`mt-4 line-clamp-2 max-w-xs font-semibold leading-[1.08] tracking-[-.035em] text-white ${compactFeature ? "text-2xl" : "text-3xl"}`}
          >
            {title}
          </h3>
          {intro && (
            <div className="mt-auto flex min-h-[4.625rem] items-center rounded-2xl border border-white/20 bg-black/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md">
              <p className="line-clamp-2 text-xs leading-5 text-white/80">
                {intro}
              </p>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="relative h-full">
    <Link
      href={href}
      className="group flex h-full flex-col transition-transform duration-300 ease-out focus:outline-none hover:-translate-y-1 active:scale-[.97]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-surface-sub shadow-[0_6px_18px_rgba(25,31,40,.09)] transition-shadow duration-300 group-hover:shadow-[0_14px_30px_rgba(25,31,40,.13)] group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2">
        {thumbnail ? (
          <SafeImage
            src={thumbnail}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 22vw"
            className="object-cover transition-transform duration-[650ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <MediaPlaceholder />
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <p className="line-clamp-2 min-h-[2.4rem] text-sm font-bold leading-snug text-ink transition-colors group-hover:text-primary">
          {title}
        </p>
        {/* No author identity on list cards; trust badges alone signal
            credibility when the author has earned them. */}
        {showAuthor && post.author_badges.length > 0 && (
          <span className="mt-auto flex flex-wrap gap-1 pt-2.5">
            {post.author_badges.map((badge) => (
              <BadgePill
                key={badge.code}
                code={badge.code}
                label={locale === "ko" ? badge.name_ko : badge.name_en}
              />
            ))}
          </span>
        )}
      </div>
    </Link>
    {bookmark && (
      <div className="absolute right-2 top-2 z-10">
        <BookmarkButton
          postId={post.id}
          returnTo={bookmark.returnTo}
          saved={bookmark.saved}
          saveLabel={bookmark.saveLabel}
          savedLabel={bookmark.savedLabel}
          size="sm"
        />
      </div>
    )}
    </div>
  );
}
