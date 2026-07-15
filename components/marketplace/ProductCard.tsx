import Link from "next/link";
import { repThumbnail } from "@/lib/media";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { SafeImage } from "@/components/ui/SafeImage";
import type { PostTeaser } from "@/lib/types";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";
import { BadgePill } from "@/components/ui/Badge";
import { stripRichText } from "@/lib/richtext";

// Two layouts share the trust data:
//  - `feature` (landing): an Apple-store style white card — badges, a title
//    and a one-line intro at the top, product image beneath.
//  - default (board grids): image tile with the title + author row below.
export function ProductCard({
  post,
  href,
  locale,
  priority = false,
  showAuthor = true,
  feature = false,
}: {
  post: PostTeaser;
  href: string;
  locale: string;
  priority?: boolean;
  showAuthor?: boolean;
  feature?: boolean;
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
        className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_4px_22px_rgba(25,31,40,.06)] transition-[transform,box-shadow] duration-300 ease-out focus:outline-none hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(25,31,40,.13)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[.99]"
      >
        <div className="px-6 pt-6">
          {post.author_badges.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {post.author_badges.map((badge) => (
                <BadgePill
                  key={badge.code}
                  code={badge.code}
                  label={locale === "ko" ? badge.name_ko : badge.name_en}
                />
              ))}
            </div>
          )}
          <h3 className="line-clamp-2 text-xl font-bold leading-tight tracking-[-.02em] text-ink">
            {title}
          </h3>
          {intro && (
            <p className="mt-1.5 line-clamp-1 text-sm text-ink-soft">{intro}</p>
          )}
        </div>
        <div className="relative mt-5 min-h-[13rem] w-full flex-1">
          {thumbnail ? (
            <SafeImage
              src={thumbnail}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 24vw"
              className="object-cover transition-transform duration-[650ms] ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <MediaPlaceholder />
          )}
        </div>
      </Link>
    );
  }

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
      </div>
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
    </Link>
  );
}
