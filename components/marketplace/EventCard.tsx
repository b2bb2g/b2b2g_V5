import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { repThumbnail } from "@/lib/media";
import {
  eventStatus,
  eventCountdown,
  formatEventRange,
  type EventStatus,
} from "@/lib/events";
import type { Locale } from "@/lib/constants";

export type EventCardLabels = {
  ongoing: string;
  upcoming: string;
  ended: string;
  venueTbd: string;
};

type EventCardPost = {
  title_en: string;
  title_ko: string | null;
  rep_image_path: string | null;
  rep_video_url: string | null;
  rep_is_video?: boolean | null;
  event_start: string | null;
  event_end: string | null;
  event_venue: string | null;
};

function Pin() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

function Cal() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
      <path d="M3 9.5h18M8 3v3M16 3v3" />
    </svg>
  );
}

// The single event-card design used on the landing, the /events board and the
// detail "more events" rail. Shares the ProductCard frame (rounding, ring,
// soft shadow, hover lift) so products and events read as one card family;
// only the content differs — status, schedule and venue instead of UID/badges.
export function EventCard({
  post,
  href,
  locale,
  labels,
  priority = false,
}: {
  post: EventCardPost;
  href: string;
  locale: Locale;
  labels: EventCardLabels;
  priority?: boolean;
}) {
  const status = eventStatus(post.event_start, post.event_end);
  const range = formatEventRange(post.event_start, post.event_end, locale);
  const countdown =
    status === "upcoming" && post.event_start
      ? eventCountdown(post.event_start)
      : null;
  const title = locale === "ko" && post.title_ko ? post.title_ko : post.title_en;
  const thumb = repThumbnail(post);
  const ended = status === "ended";
  const statusText: Record<EventStatus, string> = {
    ongoing: labels.ongoing,
    upcoming: labels.upcoming,
    ended: labels.ended,
  };
  const statusColor: Record<EventStatus, string> = {
    ongoing: "text-positive",
    upcoming: "text-primary-strong",
    ended: "text-ink-faint",
  };

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_35px_rgba(25,31,40,.06)] ring-1 ring-line/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-(--shadow-float) hover:ring-primary/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-sub">
        {thumb ? (
          <SafeImage
            src={thumb}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.035] ${ended ? "opacity-75 grayscale-[.4]" : ""}`}
          />
        ) : (
          <MediaPlaceholder />
        )}
        {status && (
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur ${statusColor[status]}`}
          >
            {status === "ongoing" && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
              </span>
            )}
            {statusText[status]}
          </span>
        )}
        {countdown && (
          <span className="absolute right-3 top-3 rounded-full bg-[#101923]/80 px-2 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur">
            {countdown}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {range && (
          <span
            className={`flex items-center gap-1.5 text-xs font-bold ${ended ? "text-ink-faint" : "text-primary"}`}
          >
            <Cal />
            {range}
          </span>
        )}
        <strong className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-extrabold leading-snug group-hover:text-primary">
          {title}
        </strong>
        <span className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-ink-soft">
          <Pin />
          <span className="truncate">{post.event_venue ?? labels.venueTbd}</span>
        </span>
      </div>
    </Link>
  );
}
