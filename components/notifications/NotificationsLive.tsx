"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Keeps the notification list itself live: new arrivals and reads made on
// other devices re-render the page without a manual refresh (the bell
// already does this for its badge).
export function NotificationsLive({ userId }: { userId: string }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      // Debounced: bulk updates (mark all read) arrive as a burst of events.
      timer.current = setTimeout(() => router.refresh(), 350);
    };
    const channel = supabase
      .channel(`notifications-page-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`,
        },
        refresh,
      )
      .subscribe();
    const onFocus = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId, router]);

  return null;
}
