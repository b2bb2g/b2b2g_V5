import Link from "next/link";
import { repThumbnail } from "@/lib/media";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { SafeImage } from "@/components/ui/SafeImage";
import type { PostTeaser } from "@/lib/types";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";
import { stripRichText } from "@/lib/richtext";

// Frosted overlay chip colour by badge code (readable on any photo).
const OVERLAY_BADGE: Record<string, string> = {
  manufacturer: "text-navy",
  certified: "text-positive",
  verified: "text-positive",
  coordinator: "text-caution",
};

// Mobile-app gallery card: a rounded image tile that lifts on hover and
// presses in on tap, with clean text below on the page surface (no heavy card
// frame). Title is one line, the intro two, both ellipsised. `imageBadges`
// floats the trust badges over the image (landing); `showAuthor` shows the
// UID/badge row below. This is the shared landing card family.
export function ProductCard({
  post,
  href,
  locale,
  priority = false,
  showAuthor = true,
  imageBadges = false,
}: {
  post: PostTeaser;
  href: string;
  locale: string;
  priority?: boolean;
  showAuthor?: boolean;
  imageBadges?: boolean;
}) {
  const thumbnail = repThumbnail(post);
  const title =
    locale === "ko" && post.title_ko ? post.title_ko : post.title_en;
  const intro = stripRichText(
    locale === "ko" && post.body_teaser_ko
      ? post.body_teaser_ko
      : post.body_teaser_en,
  );

  return (
    <Link
      href={href}
      className="group flex h-full flex-col transition-transform duration-200 ease-out focus:outline-none active:scale-[.97]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-surface-sub ring-1 ring-line/60 transition-shadow duration-300 group-hover:shadow-[0_18px_45px_rgba(25,31,40,.16)] group-focus-visible:ring-2 group-focus-visible:ring-primary">
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
        {imageBadges && post.author_badges.length > 0 && (
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {post.author_badges.map((badge) => (
              <span
                key={badge.code}
                className={`inline-flex items-center rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold shadow-sm backdrop-blur ${OVERLAY_BADGE[badge.code] ?? "text-ink-soft"}`}
              >
                {locale === "ko" ? badge.name_ko : badge.name_en}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-primary">
          {title}
        </p>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-ink-soft">
          {intro}
        </p>
        {showAuthor && (
          <AuthorIdentity
            uid={post.author_uid}
            badges={post.author_badges}
            locale={locale}
            className="mt-auto pt-2.5 text-xs font-semibold text-ink-faint"
          />
        )}
      </div>
    </Link>
  );
}
