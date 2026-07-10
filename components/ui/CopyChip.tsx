"use client";

import { useState } from "react";

// Inline value with a small copy icon (used for the member UID).
export function CopyChip({
  value,
  display,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  display: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
      {display}
      <button
        type="button"
        aria-label={copied ? copiedLabel : copyLabel}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
        className="flex h-5 w-5 items-center justify-center rounded text-ink-faint transition-colors hover:bg-surface-sub hover:text-ink-soft"
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-positive" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>
    </span>
  );
}
