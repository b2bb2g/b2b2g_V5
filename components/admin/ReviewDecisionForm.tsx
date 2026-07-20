"use client";

import { useState } from "react";
import { PendingButton } from "@/components/ui/PendingButton";

// Shared review control for the moderation queues (posts, messages). Approve is
// the primary one-click path; rejecting is a deliberate two-step that only then
// reveals the required reason — so the common action stays fast and the
// destructive one is intentional.
export function ReviewDecisionForm({
  action,
  idField,
  idValue,
  approveValue,
  approveLabel,
  rejectValue,
  rejectLabel,
  confirmRejectLabel,
  reasonPlaceholder,
  cancelLabel,
  feedbackPlaceholder,
}: {
  action: (formData: FormData) => void | Promise<void>;
  idField: string;
  idValue: string;
  approveValue: string;
  approveLabel: string;
  rejectValue: string;
  rejectLabel: string;
  confirmRejectLabel: string;
  reasonPlaceholder: string;
  cancelLabel: string;
  feedbackPlaceholder?: string;
}) {
  const [rejecting, setRejecting] = useState(false);

  return (
    <form action={action} className="mt-4 space-y-2.5">
      <input type="hidden" name={idField} value={idValue} />
      {rejecting ? (
        <>
          <input
            name="reason"
            required
            autoFocus
            placeholder={reasonPlaceholder}
            className="field"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="btn-secondary btn-md flex-1"
            >
              {cancelLabel}
            </button>
            <PendingButton
              type="submit"
              name="decision"
              value={rejectValue}
              className="btn-danger btn-md flex-1"
            >
              {confirmRejectLabel}
            </PendingButton>
          </div>
        </>
      ) : (
        <>
          {feedbackPlaceholder && (
            <input
              name="feedback"
              placeholder={feedbackPlaceholder}
              className="field"
            />
          )}
          <div className="flex gap-2">
            <PendingButton
              type="submit"
              name="decision"
              value={approveValue}
              data-review-approve
              className="btn-primary btn-md flex-1"
            >
              {approveLabel}
            </PendingButton>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              data-review-reject
              className="btn-secondary btn-md flex-1 text-negative"
            >
              {rejectLabel}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
