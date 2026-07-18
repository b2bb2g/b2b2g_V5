"use client";

import { useEffect, useRef, useState } from "react";
import { loadMoreFeed } from "@/app/actions/feed";
import { FeedCard, type FeedLabels } from "@/components/feed/FeedCard";
import type { FeedItem } from "@/lib/data/feed";

const PAGE_SIZE = 12;

// Infinite feed: renders the server-provided first page, then appends more
// as the sentinel scrolls into view (cursor = oldest loaded timestamp).
export function FeedStream({
  initialItems,
  viewerId,
  returnTo,
  labels,
}: {
  initialItems: FeedItem[];
  viewerId: string | null;
  returnTo: string;
  labels: FeedLabels;
}) {
  const [items, setItems] = useState(initialItems);
  const [done, setDone] = useState(initialItems.length < PAGE_SIZE);
  const loading = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);
  // Latest items stay readable inside the observer callback.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || done) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting || loading.current) return;
      loading.current = true;
      try {
        const cursor = itemsRef.current[itemsRef.current.length - 1]?.createdAt;
        if (!cursor) {
          setDone(true);
          return;
        }
        const more = await loadMoreFeed(cursor);
        setItems((current) => {
          const seen = new Set(current.map((item) => item.id));
          return [...current, ...more.filter((item) => !seen.has(item.id))];
        });
        if (more.length < PAGE_SIZE) setDone(true);
      } finally {
        loading.current = false;
      }
    }, { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [done]);

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            viewerId={viewerId}
            returnTo={returnTo}
            labels={labels}
          />
        ))}
      </div>
      {!done && (
        <div ref={sentinel} className="flex justify-center py-6" aria-hidden="true">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </>
  );
}
