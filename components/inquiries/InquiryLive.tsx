"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Keeps an open thread current without polling forms: delivery/return
// notifications for this inquiry arrive over the member's RLS-scoped
// realtime stream and trigger a server re-render. Focus regains are the
// fallback for dropped sockets.
export function InquiryLive({
  inquiryId,
  userId,
  messageCount,
}: {
  inquiryId: string;
  userId: string;
  messageCount: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`inquiry-${inquiryId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`,
        },
        (change) => {
          const payload = (change.new as { payload?: { inquiry_id?: string } })
            ?.payload;
          if (payload?.inquiry_id === inquiryId) router.refresh();
        },
      )
      .subscribe();
    const onFocus = () => {
      if (!document.hidden) router.refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [inquiryId, userId, router]);

  // Long threads open at the newest message, like any messenger.
  useEffect(() => {
    if (messageCount < 5) return;
    const timer = setTimeout(() => {
      document
        .getElementById("thread-end")
        ?.scrollIntoView({ block: "end", behavior: "instant" });
    }, 60);
    return () => clearTimeout(timer);
    // Only on first mount; refreshes should not yank the scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
