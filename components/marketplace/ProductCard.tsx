import Link from "next/link";
import { repThumbnail } from "@/lib/media";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { SafeImage } from "@/components/ui/SafeImage";
import type { PostTeaser } from "@/lib/types";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";

// Solid, high-contrast overlay badges so trust reads at a glance on any photo.
const OVERLAY_BADGE: Record<string, string> = {
  manufacturer: "bg-navy text-white",
  certified: "bg-positive text-white",
  verified: "bg-positive text-white",
  coordinator: "bg-caution text-white",
};
const CHECK_BADGE = new Set(["certified", "verified"]);

function Check() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

// Mobile-app gallery card: a rounded image tile that lifts on hover and presses
// in on tap. `overlayTitle` (landing) makes it a poster — the title sits over
// the image on a bottom gradient, always anchored to the bottom so one- and
// two-line titles stay level. `imageBadges` floats the trust badges on top.
export function ProductCard({
  post,
  href,
  locale,
  priority = false,
  showAuthor = true,
  imageBadges = false,
  overlayTitle = false,
}: {
  post: PostTeaser;
  href: string;
  locale: string;
  priority?: boolean;
  showAuthor?: boolean;
  imageBadges?: boolean;
  overlayTitle?: boolean;
}) {
  const thumbnail = repThumbnail(post);
  const title =
    locale === "ko" && post.title_ko ? post.title_ko : post.title_en;

  return (
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
        {imageBadges && post.author_badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {post.author_badges.map((badge) => (
              <span
                key={badge.code}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-[0_2px_8px_rgba(0,0,0,.28)] ${OVERLAY_BADGE[badge.code] ?? "bg-white/95 text-ink"}`}
              >
                {CHECK_BADGE.has(badge.code) && <Check />}
                {locale === "ko" ? badge.name_ko : badge.name_en}
              </span>
            ))}
          </div>
        )}
        {overlayTitle && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
              aria-hidden="true"
            />
            <p className="absolute inset-x-0 bottom-0 line-clamp-2 px-4 pb-4 text-[15px] font-bold leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,.45)]">
              {title}
            </p>
          </>
        )}
      </div>
      {!overlayTitle && (
        <div className="flex flex-1 flex-col px-1 pt-3">
          <p className="line-clamp-2 min-h-[2.4rem] text-sm font-bold leading-snug text-ink transition-colors group-hover:text-primary">
            {title}
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
      )}
    </Link>
  );
}
