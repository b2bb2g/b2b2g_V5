"use client";

import { useState, type InputHTMLAttributes } from "react";

const baseCls =
  "w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary";
const iconBtnCls =
  "flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:text-ink-soft";

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-1.72-10.78a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
      />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 11 7 11 7a13.2 13.2 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.5 13.5 0 0 0 1 12s4 7 11 7a10.4 10.4 0 0 0 5.39-1.61" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </>
      ) : (
        <>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  clearLabel: string;
};

// Text input with a one-tap clear button (shown while it has a value).
export function ClearableInput({ clearLabel, defaultValue, className, onChange, ...props }: FieldProps) {
  const [value, setValue] = useState(String(defaultValue ?? ""));

  return (
    <div className="relative">
      <input
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e);
        }}
        className={`${baseCls} pr-10 ${className ?? ""}`}
      />
      {value.length > 0 && (
        <span className="absolute inset-y-0 right-2 flex items-center">
          <button type="button" aria-label={clearLabel} onClick={() => setValue("")} className={iconBtnCls}>
            <ClearIcon />
          </button>
        </span>
      )}
    </div>
  );
}

type PasswordProps = FieldProps & {
  showLabel: string;
  hideLabel: string;
};

// Password input with clear + show/hide toggle.
export function PasswordInput({
  clearLabel,
  showLabel,
  hideLabel,
  className,
  onChange,
  ...props
}: PasswordProps) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e);
        }}
        className={`${baseCls} pr-16 ${className ?? ""}`}
      />
      <span className="absolute inset-y-0 right-2 flex items-center gap-0.5">
        {value.length > 0 && (
          <button type="button" aria-label={clearLabel} onClick={() => setValue("")} className={iconBtnCls}>
            <ClearIcon />
          </button>
        )}
        <button
          type="button"
          aria-label={visible ? hideLabel : showLabel}
          onClick={() => setVisible((v) => !v)}
          className={iconBtnCls}
        >
          <EyeIcon off={visible} />
        </button>
      </span>
    </div>
  );
}
