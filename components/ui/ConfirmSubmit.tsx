"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Global two-step confirmation pattern (PRD 14): every action button asks
// once more before it fires; while pending it shows a loading state.
function PendingButton({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" />
      ) : (
        children
      )}
    </button>
  );
}

export function ConfirmSubmit({
  label,
  confirmTitle,
  confirmBody,
  confirmLabel,
  cancelLabel,
  className = "rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong",
  destructive = false,
}: {
  label: string;
  confirmTitle: string;
  confirmBody: string;
  confirmLabel: string;
  cancelLabel: string;
  className?: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-card bg-surface p-5 shadow-xl">
            <p className="text-base font-bold">{confirmTitle}</p>
            <p className="mt-1 text-sm text-ink-soft">{confirmBody}</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-surface-sub px-4 py-2.5 text-sm font-semibold text-ink-soft"
              >
                {cancelLabel}
              </button>
              <PendingButton
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                  destructive ? "bg-negative" : "bg-primary hover:bg-primary-strong"
                }`}
              >
                {confirmLabel}
              </PendingButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
