"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

// Standard edit/add page frame (UX convention): server-rendered fields go in
// as children; the frame adds cancel + save, tracks dirtiness, and double-
// confirms before discarding changes.
function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong disabled:opacity-50"
    >
      {pending ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" />
      ) : (
        label
      )}
    </button>
  );
}

// Shared discard-confirmation modal (double-confirm rule) for edit screens.
export function DiscardModal({
  open,
  discardTitle,
  discardBody,
  discardConfirm,
  keepEditing,
  onKeep,
  onDiscard,
}: {
  open: boolean;
  discardTitle: string;
  discardBody: string;
  discardConfirm: string;
  keepEditing: string;
  onKeep: () => void;
  onDiscard: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-card bg-surface p-5 shadow-xl">
        <p className="text-base font-bold">{discardTitle}</p>
        <p className="mt-1 text-sm text-ink-soft">{discardBody}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onKeep}
            className="flex-1 rounded-xl bg-surface-sub px-4 py-2.5 text-sm font-semibold text-ink-soft"
          >
            {keepEditing}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 rounded-xl bg-negative px-4 py-2.5 text-sm font-semibold text-white"
          >
            {discardConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditFormFrame({
  action,
  cancelHref,
  saveLabel,
  cancelLabel,
  discardTitle,
  discardBody,
  discardConfirm,
  keepEditing,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  saveLabel: string;
  cancelLabel: string;
  discardTitle: string;
  discardBody: string;
  discardConfirm: string;
  keepEditing: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const dirty = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function onCancel() {
    if (dirty.current) setConfirmOpen(true);
    else router.push(cancelHref);
  }

  return (
    <form
      action={action}
      onInput={() => {
        dirty.current = true;
      }}
      className="space-y-3"
    >
      {children}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-surface-sub px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-line/60"
        >
          {cancelLabel}
        </button>
        <SaveButton label={saveLabel} />
      </div>

      <DiscardModal
        open={confirmOpen}
        discardTitle={discardTitle}
        discardBody={discardBody}
        discardConfirm={discardConfirm}
        keepEditing={keepEditing}
        onKeep={() => setConfirmOpen(false)}
        onDiscard={() => router.push(cancelHref)}
      />
    </form>
  );
}
