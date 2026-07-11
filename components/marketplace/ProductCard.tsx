import Image from "next/image";
import Link from "next/link";
import { repThumbnail } from "@/lib/media";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import type { PostTeaser } from "@/lib/types";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";

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
      className="group block h-full overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_35px_rgba(25,31,40,.06)] ring-1 ring-line/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-(--shadow-float) hover:ring-primary/30"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-sub">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <MediaPlaceholder />
        )}
        <span
          className="absolute right-3 top-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100"
          aria-hidden="true"
        >
          →
        </span>
      </div>
      <div className="space-y-1.5 p-4">
        <p className="line-clamp-2 text-sm font-extrabold leading-snug">
          {title}
        </p>
        {showAuthor && (
          <AuthorIdentity
            uid={post.author_uid}
            badges={post.author_badges}
            locale={locale}
            className="text-xs font-semibold text-ink-faint"
          />
        )}
      </div>
    </Link>
  );
}
