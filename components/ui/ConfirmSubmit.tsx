"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useFocusTrap } from "@/lib/use-focus-trap";

// Global two-step confirmation pattern (PRD 14): every action button asks
// once more before it fires; while pending it shows a loading state.
function PendingButton({
  className,
  children,
  onSettled,
}: {
  className: string;
  children: ReactNode;
  onSettled: () => void;
}) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  // Most actions revalidate in place instead of navigating, so the dialog
  // must close itself once the submission settles.
  useEffect(() => {
    if (wasPending.current && !pending) onSettled();
    wasPending.current = pending;
  }, [pending, onSettled]);
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
  const dialogRef = useFocusTrap<HTMLDivElement>(open);
  const titleId = useId();
  const bodyId = useId();

  // Escape closes the confirmation (the focus trap handles focus in/out).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className="w-full max-w-sm rounded-card bg-surface p-5 shadow-xl"
          >
            <p id={titleId} className="text-base font-bold">
              {confirmTitle}
            </p>
            <p id={bodyId} className="mt-1 text-sm text-ink-soft">
              {confirmBody}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-surface-sub px-4 py-2.5 text-sm font-semibold text-ink-soft"
              >
                {cancelLabel}
              </button>
              <PendingButton
                onSettled={() => setOpen(false)}
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
