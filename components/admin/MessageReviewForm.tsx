"use client";

import { useState } from "react";
import { PendingButton } from "@/components/ui/PendingButton";

// Two-step review: Forward is the primary path; returning is intentional and
// only then reveals the required reason. Keeps the common action fast and the
// destructive one deliberate.
export function MessageReviewForm({
  messageId,
  action,
  labels,
}: {
  messageId: string;
  action: (formData: FormData) => void | Promise<void>;
  labels: {
    feedback: string;
    forward: string;
    return: string;
    reason: string;
    cancel: string;
    confirmReturn: string;
  };
}) {
  const [returning, setReturning] = useState(false);

  return (
    <form action={action} className="mt-4 space-y-2.5">
      <input type="hidden" name="messageId" value={messageId} />
      {returning ? (
        <>
          <input
            name="reason"
            required
            autoFocus
            placeholder={labels.reason}
            className="field"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setReturning(false)}
              className="btn-secondary btn-md flex-1"
            >
              {labels.cancel}
            </button>
            <PendingButton
              type="submit"
              name="decision"
              value="reject"
              className="btn-danger btn-md flex-1"
            >
              {labels.confirmReturn}
            </PendingButton>
          </div>
        </>
      ) : (
        <>
          <input name="feedback" placeholder={labels.feedback} className="field" />
          <div className="flex gap-2">
            <PendingButton
              type="submit"
              name="decision"
              value="forward"
              className="btn-primary btn-md flex-1"
            >
              {labels.forward}
            </PendingButton>
            <button
              type="button"
              onClick={() => setReturning(true)}
              className="btn-secondary btn-md flex-1 text-negative"
            >
              {labels.return}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
