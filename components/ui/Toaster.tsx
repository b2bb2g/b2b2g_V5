"use client";

/* eslint-disable react-hooks/set-state-in-effect -- the toast is driven by
   the ?toast= URL param; state must sync from it inside the effect. */

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Global action-result toast (DESIGN 3). Server actions redirect with
// ?toast=<key>; the key is looked up in the i18n message map, shown briefly,
// and stripped from the URL so refresh/back does not replay it.
export function Toaster({ messages }: { messages: Record<string, string> }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  const key = params.get("toast");

  useEffect(() => {
    if (!key) return;
    const next = new URLSearchParams(params);
    next.delete("toast");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
    const text = messages[key];
    if (!text) return;
    setMessage(text);
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params/messages are stable per navigation; re-run only when the toast key changes
  }, [key]);

  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <button
        type="button"
        onClick={() => setMessage(null)}
        className="pointer-events-auto animate-[toast-in_0.25s_ease-out] rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
      >
        {message}
      </button>
    </div>
  );
}
