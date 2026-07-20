"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import {
  clearCompare,
  getCompareServerSnapshot,
  getCompareSnapshot,
  subscribeCompare,
  toggleCompare,
} from "@/lib/compare-store";

function useCompareSelection() {
  return useSyncExternalStore(
    subscribeCompare,
    getCompareSnapshot,
    getCompareServerSnapshot,
  );
}

/** Per-card pick control (sits opposite the bookmark heart). */
export function CompareToggle({
  postId,
  label,
}: {
  postId: string;
  label: string;
}) {
  const selection = useCompareSelection();
  const active = selection.includes(postId);
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => toggleCompare(postId)}
      className={`flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-extrabold shadow-[0_4px_14px_rgba(25,31,40,.16)] backdrop-blur transition ${
        active
          ? "bg-primary text-white"
          : "bg-white/92 text-ink-soft hover:text-primary"
      }`}
    >
      {active ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      )}
      {label}
    </button>
  );
}

/** Floating action bar once at least one product is picked. */
export function CompareBar({
  labels,
}: {
  labels: { selected: string; compare: string; clear: string };
}) {
  const selection = useCompareSelection();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted || selection.length === 0) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-4 z-[120] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-line bg-white py-2 pl-5 pr-2 shadow-[0_18px_50px_rgba(25,31,40,.22)]">
        <p className="text-sm font-extrabold">
          {labels.selected.replace("{n}", String(selection.length))}
        </p>
        <button
          type="button"
          onClick={clearCompare}
          className="text-xs font-bold text-ink-faint transition-colors hover:text-negative"
        >
          {labels.clear}
        </button>
        {selection.length >= 2 ? (
          <Link
            href={`/dashboard/bookmarks/compare?ids=${selection.join(",")}`}
            className="btn-primary btn-md rounded-full"
          >
            {labels.compare}
          </Link>
        ) : (
          <span className="btn-primary btn-md cursor-not-allowed rounded-full opacity-40">
            {labels.compare}
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
}
