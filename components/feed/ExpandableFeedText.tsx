"use client";

import { useEffect, useId, useRef, useState } from "react";

export type FeedTextVariant = "compact" | "stream" | "detail";

export function ExpandableFeedText({
  body,
  moreLabel,
  lessLabel,
  fullPostLabel,
  variant,
  hasMedia,
  textExpanded,
  onTextExpandedChange,
  onOpenFocus,
}: {
  body: string;
  moreLabel: string;
  lessLabel: string;
  fullPostLabel: string;
  variant: FeedTextVariant;
  hasMedia: boolean;
  textExpanded: boolean;
  onTextExpandedChange: (expanded: boolean) => void;
  onOpenFocus: (trigger: HTMLButtonElement) => void;
}) {
  const [canCollapse, setCanCollapse] = useState(false);
  const measureRef = useRef<HTMLSpanElement>(null);
  const bodyId = useId();
  // Rail cards without media let the text carry the card (LinkedIn-style)
  // instead of clamping to two lines above a large void.
  const clampLines = variant === "compact" && !hasMedia ? 10 : 2;
  const clampClass = clampLines === 10 ? "line-clamp-[10]" : "line-clamp-2";

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
  }, [body, clampLines]);

  const openFocus = (trigger: HTMLButtonElement) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    onOpenFocus(trigger);
  };

  const fullText = variant === "detail" || textExpanded;
  const focusAction = variant === "compact" || (!canCollapse && hasMedia);

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
          {body}
        </span>

        {fullText ? (
          <p id={bodyId} className="whitespace-pre-wrap">
            {body}
          </p>
        ) : canCollapse ? (
          <button
            type="button"
            data-feed-text-expand={variant === "stream" ? "" : undefined}
            data-feed-body-focus={variant === "compact" ? "" : undefined}
            aria-expanded="false"
            aria-controls={bodyId}
            aria-label={variant === "stream" ? moreLabel : fullPostLabel}
            aria-describedby={bodyId}
            onClick={(event) => {
              if (variant === "stream") {
                onTextExpandedChange(true);
              } else {
                openFocus(event.currentTarget);
              }
            }}
            className="relative block w-full cursor-pointer select-text rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span id={bodyId} className={`${clampClass} whitespace-pre-wrap`}>
              {body}
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
              {body}
            </span>
          </button>
        ) : (
          <p id={bodyId} className="whitespace-pre-wrap">
            {body}
          </p>
        )}
      </div>

      {variant === "stream" && canCollapse && textExpanded && (
        <button
          type="button"
          data-feed-text-collapse
          aria-expanded="true"
          aria-controls={bodyId}
          onClick={() => onTextExpandedChange(false)}
          className="mt-1 font-semibold text-ink-soft hover:text-ink focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {lessLabel}
        </button>
      )}
    </div>
  );
}
