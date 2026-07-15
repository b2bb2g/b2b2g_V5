import Link from "next/link";
import { repThumbnail } from "@/lib/media";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { SafeImage } from "@/components/ui/SafeImage";
import type { PostTeaser } from "@/lib/types";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";

// Mobile-app gallery card: a rounded image tile that lifts on hover and
// presses in on tap, with clean text below on the page surface (no heavy card
// frame). Title reserves two lines and the author row is pinned to the bottom
// so every tile keeps the same shape. This is the shared landing card family.
export function ProductCard({
  post,
  href,
  locale,
  priority = false,
  showAuthor = true,
}: {
  post: PostTeaser;
  href: string;
  locale: string;
  priority?: boolean;
  showAuthor?: boolean;
}) {
  const thumbnail = repThumbnail(post);
  const title =
    locale === "ko" && post.title_ko ? post.title_ko : post.title_en;

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
