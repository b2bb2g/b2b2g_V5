"use client";

import { useState } from "react";

// Shared 6-digit code field for OTP and PIN entry. Handles paste (a pasted
// "123 456" or "code: 123456" collapses to its digits and can auto-submit),
// and when `secret` it masks the value with a show/hide eye toggle, like a
// password field.
export function CodeField({
  value,
  onChange,
  onComplete,
  secret = false,
  autoFocus = false,
  placeholder = "000000",
  ariaLabel,
  showLabel,
  hideLabel,
  size = "lg",
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  secret?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  showLabel: string;
  hideLabel: string;
  size?: "lg" | "md";
}) {
  const [visible, setVisible] = useState(false);

  const commit = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, 6);
    onChange(next);
    if (next.length === 6) onComplete?.(next);
  };

  return (
    <div className="relative">
      <input
        type={secret && !visible ? "password" : "text"}
        value={value}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete={secret ? "off" : "one-time-code"}
        maxLength={6}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => commit(event.target.value)}
        onPaste={(event) => {
          const digits = (event.clipboardData.getData("text") ?? "")
            .replace(/\D/g, "")
            .slice(0, 6);
          if (digits) {
            event.preventDefault();
            commit(digits);
          }
        }}
        className={`field w-full text-center font-extrabold ${
          size === "lg"
            ? "text-2xl tracking-[.4em]"
            : "text-lg tracking-[.35em]"
        } ${secret ? "pr-11" : ""}`}
      />
      {secret && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          title={visible ? hideLabel : showLabel}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-sub hover:text-ink-soft"
        >
          {visible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.7 5.1A11 11 0 0 1 12 5c7 0 11 7 11 7a19 19 0 0 1-2.6 3.5M6.6 6.6A19 19 0 0 0 1 12s4 7 11 7a11 11 0 0 0 5.4-1.4M9.9 9.9a3 3 0 1 0 4.2 4.2" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
