import Link from "next/link";
import type { ReactNode } from "react";

// Hashtag-aware feed body rendering. Inside buttons (clamped stream/rail
// text) tags are highlighted only — nesting links in buttons is invalid —
// while full-text views link each tag to its filtered feed.
const HASHTAG_SPLIT = /(#[\p{L}\p{N}_]+)/gu;
const HASHTAG_EXACT = /^#[\p{L}\p{N}_]+$/u;

export function renderFeedBody(body: string, linked: boolean): ReactNode[] {
  return body.split(HASHTAG_SPLIT).map((part, index) => {
    if (!HASHTAG_EXACT.test(part)) return part;
    if (!linked) {
      return (
        <span key={`${part}-${index}`} className="font-bold text-primary">
          {part}
        </span>
      );
    }
    return (
      <Link
        key={`${part}-${index}`}
        href={`/feed?tag=${encodeURIComponent(part.slice(1))}`}
        className="font-bold text-primary hover:underline"
      >
        {part}
      </Link>
    );
  });
}
