"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NOTIFICATION_STATE } from "@/lib/constants";

// Live unread badge: subscribes to the member's notification rows
// (RLS-scoped realtime) and refreshes the count on any change.
export function NotificationBell({
  userId,
  initialCount,
  label,
  unreadLabel,
}: {
  userId: string;
  initialCount: number;
  label: string;
  unreadLabel: string;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();
    const refresh = async () => {
      const { count: unread } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", userId)
        .eq("state", NOTIFICATION_STATE.UNREAD);
      setCount(unread ?? 0);
    };
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`,
        },
        refresh
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      className="relative rounded-full p-2 text-ink-soft transition-colors hover:bg-surface-sub"
      aria-label={count > 0 ? `${label}, ${count} ${unreadLabel}` : label}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span title={unreadLabel} className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
