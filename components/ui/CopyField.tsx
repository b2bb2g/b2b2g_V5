"use client";

import { useState } from "react";

export function CopyField({
  value,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={value}
        className="w-full truncate rounded-xl border border-line bg-surface-sub/60 px-3 py-2 text-xs text-ink-soft"
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-strong"
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
