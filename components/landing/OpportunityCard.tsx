import Link from "next/link";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";
import { SafeImage } from "@/components/ui/SafeImage";
import { POST_STATUS, type Locale } from "@/lib/constants";
import { repThumbnail } from "@/lib/media";
import { stripRichText } from "@/lib/richtext-text";
import type { PostTeaser } from "@/lib/types";

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function RequestArtwork() {
  return (
    <span
      className="absolute inset-0 overflow-hidden bg-[linear-gradient(145deg,#0b4fc4_0%,#0a68df_46%,#6eb4ff_100%)]"
      aria-hidden="true"
    >
      <span className="absolute -right-16 -top-14 h-64 w-64 rounded-full border-[2.6rem] border-white/10" />
      <span className="absolute -bottom-20 -left-14 h-72 w-72 rounded-full border-[3.2rem] border-white/8" />
      <span className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:32px_32px]" />
      <span className="absolute right-7 top-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/24 bg-white/12 text-white backdrop-blur-md">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 3h10a2 2 0 0 1 2 2v14l-4-3H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M8.5 8.5h7M8.5 12h4.5" />
        </svg>
      </span>
      <span className="absolute bottom-28 left-7 text-[4.75rem] font-semibold leading-none tracking-[-.07em] text-white/12">
        RFQ
      </span>
    </span>
  );
}

export function OpportunityCard({
  post,
  href,
  locale,
  labels,
}: {
  post: PostTeaser;
  href: string;
  locale: Locale;
  labels: {
    open: string;
    closed: string;
    openEnded: string;
    deadline: string;
    sourcingRequest: string;
  };
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
    Boolean(post.deadline && post.deadline < today);

  return (
    <Link
      href={href}
      className="store-card-interactive group relative flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] bg-[#0c1726] text-white focus:outline-none"
    >
      {thumbnail ? (
        <SafeImage
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 734px) 82vw, 400px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
      ) : (
        <RequestArtwork />
      )}
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07111f]/88 via-[#07111f]/20 to-[#07111f]/90"
        aria-hidden="true"
      />

      <span className="relative flex h-full flex-col p-7">
        <span className="flex min-h-7 flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              closed
                ? "border border-white/20 bg-black/24 text-white/78"
                : "border border-[#82ef9f] bg-[#d8ffe1] text-[#11602b]"
            }`}
          >
            {closed ? labels.closed : labels.open}
          </span>
          {!closed && (
            <span className="rounded-full border border-white/22 bg-black/24 px-3 py-1 text-[11px] font-semibold text-white/86 backdrop-blur-md">
              {post.deadline
                ? `${labels.deadline} ${post.deadline}`
                : labels.openEnded}
            </span>
          )}
        </span>

        <span className="mt-5 text-xs font-bold uppercase tracking-[.15em] text-white/62">
          {labels.sourcingRequest}
        </span>
        <strong className="mt-3 line-clamp-3 text-[1.8rem] font-semibold leading-[1.08] tracking-[-.035em] text-white">
          {title}
        </strong>

        <span className="mt-auto rounded-2xl border border-white/18 bg-black/45 p-4 backdrop-blur-md">
          <span className="line-clamp-2 min-h-10 text-xs leading-5 text-white/76">
            {teaser}
          </span>
          <span className="mt-3 flex items-center justify-between gap-3 border-t border-white/14 pt-3">
            <AuthorIdentity
              uid={post.author_uid}
              badges={post.author_badges}
              locale={locale}
              className="min-w-0 text-xs font-semibold text-white/68"
            />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#111827] transition-transform duration-300 group-hover:translate-x-0.5">
              <Arrow />
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}
