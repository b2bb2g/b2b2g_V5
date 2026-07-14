"use client";

import { useFormStatus } from "react-dom";
import { SendIcon } from "@/components/feed/FeedIcons";

export function CommentSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      title={label}
      aria-busy={pending}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary-strong disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {pending ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <SendIcon className="h-5 w-5 fill-none stroke-current stroke-[2]" />
      )}
    </button>
  );
}
