"use client";

import { useState } from "react";

export function ExpandableFeedText({
  body,
  moreLabel,
  lessLabel,
}: {
  body: string;
  moreLabel: string;
  lessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = body.length > 210 || body.split("\n").length > 4;

  return (
    <div className="px-5 pb-4 text-[15px] leading-7 text-ink sm:px-6">
      <p
        className={
          expanded || !canCollapse
            ? "whitespace-pre-wrap"
            : "line-clamp-4 whitespace-pre-wrap"
        }
      >
        {body}
      </p>
      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 font-semibold text-ink-soft hover:text-ink"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
