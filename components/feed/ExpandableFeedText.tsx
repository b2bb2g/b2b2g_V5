"use client";

import { useEffect, useId, useRef, useState } from "react";
import { renderFeedBody } from "@/components/feed/FeedBodyText";

export type FeedTextVariant = "compact" | "stream" | "detail";

export function ExpandableFeedText({
  body,
  moreLabel,
  fullPostLabel,
  variant,
  hasMedia,
  onOpenFocus,
}: {
  body: string;
  moreLabel: string;
  fullPostLabel: string;
  variant: FeedTextVariant;
  hasMedia: boolean;
  onOpenFocus: (trigger: HTMLButtonElement) => void;
}) {
  const [canCollapse, setCanCollapse] = useState(false);
  const measureRef = useRef<HTMLSpanElement>(null);
  const bodyId = useId();
  // Rail cards without media let the text carry the card (LinkedIn-style)
  // instead of clamping to two lines above a large void.
  const clampLines = variant === "compact" && !hasMedia ? 10 : 2;
  const clampClass = clampLines === 10 ? "line-clamp-[10]" : "line-clamp-2";
  // Rail cards collapse paragraph gaps: inside a two-line clamp a blank line
  // spends half the budget on whitespace, so sibling cards look uneven. The
  // focus dialog and detail view keep the author's original line breaks.
  // Bodies saved from the composer use CRLF, so the blank-line match has to
  // allow the carriage returns.
  const displayBody =
    variant === "compact" ? body.replace(/(?:\r?\n){2,}/g, "\n") : body;

  useEffect(() => {
    const element = measureRef.current;
    if (!element) return;

    const measure = () => {
      const lineHeight = Number.parseFloat(
        window.getComputedStyle(element).lineHeight,
      );
      const naturalHeight = element.getBoundingClientRect().height;
      setCanCollapse(
        Number.isFinite(lineHeight) &&
          naturalHeight > lineHeight * clampLines + 1,
      );
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [displayBody, clampLines]);

  const openFocus = (trigger: HTMLButtonElement) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    onOpenFocus(trigger);
  };

  const fullText = variant === "detail";
  // Tapping the body always opens the full-post view (the dialog is where the
  // whole text and the comments live). This used to depend on whether the post
  // carried media and on whether the text overflowed, so an image post with a
  // short caption opened the dialog while a text-only post did nothing or only
  // expanded in place — the same gesture behaved four different ways.
  const focusAction = variant !== "detail";

  return (
    <div
      data-feed-text
      className={`px-5 pb-4 text-[15px] leading-7 text-ink sm:px-6 ${variant === "compact" ? "min-h-[4.5rem]" : ""}`}
    >
      <div className="relative">
        <span
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute inset-x-0 top-0 whitespace-pre-wrap"
        >
          {displayBody}
        </span>

        {fullText ? (
          <p id={bodyId} className="whitespace-pre-wrap">
            {renderFeedBody(body, true)}
          </p>
        ) : canCollapse ? (
          <button
            type="button"
            data-feed-body-focus=""
            aria-controls={bodyId}
            aria-label={fullPostLabel}
            aria-describedby={bodyId}
            onClick={(event) => openFocus(event.currentTarget)}
            className="relative block w-full cursor-pointer select-text rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span id={bodyId} className={`${clampClass} whitespace-pre-wrap`}>
              {renderFeedBody(displayBody, false)}
            </span>
            <span className="absolute bottom-0 right-0 bg-gradient-to-r from-white/0 via-white via-25% to-white pl-8 font-semibold text-ink-soft hover:text-ink">
              {moreLabel}
            </span>
          </button>
        ) : focusAction ? (
          <button
            type="button"
            data-feed-body-focus
            aria-label={fullPostLabel}
            aria-describedby={bodyId}
            onClick={(event) => openFocus(event.currentTarget)}
            className="block w-full cursor-pointer select-text rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span id={bodyId} className={`${clampClass} whitespace-pre-wrap`}>
              {renderFeedBody(displayBody, false)}
            </span>
          </button>
        ) : (
          <p id={bodyId} className="whitespace-pre-wrap">
            {renderFeedBody(body, true)}
          </p>
        )}
      </div>

    </div>
  );
}
