"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { SafeImage } from "@/components/ui/SafeImage";
import type { Locale } from "@/lib/constants";

// Device-local browsing history: works for guests, costs no database rows,
// and clears with the browser profile.
const STORAGE_KEY = "b2bb2g:recent-products";
const MAX_ITEMS = 12;

export type RecentProduct = {
  id: string;
  href: string;
  titleEn: string;
  titleKo: string;
  image: string | null;
  at: number;
};

function readRecent(): RecentProduct[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentProduct[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && item.id && item.href)
      : [];
  } catch {
    return [];
  }
}

/** Drop on a product detail page to add it to the device history. */
export function RecentProductRecorder({
  product,
}: {
  product: Omit<RecentProduct, "at">;
}) {
  useEffect(() => {
    try {
      const rest = readRecent().filter((item) => item.id !== product.id);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          [{ ...product, at: Date.now() }, ...rest].slice(0, MAX_ITEMS),
        ),
      );
    } catch {
      // History is best-effort only (private mode, full storage).
    }
    // Object identity changes per render; record per product id instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  return null;
}

export function RecentlyViewedSection({
  heading,
  locale,
  currentId,
}: {
  heading: string;
  locale: Locale;
  currentId?: string;
}) {
  const [items, setItems] = useState<RecentProduct[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(readRecent().filter((item) => item.id !== currentId));
    }, 0);
    return () => clearTimeout(timer);
  }, [currentId]);
  if (!items.length) return null;

  return (
    <section className="bg-[#f5f5f7] py-14 sm:py-16">
      <div className="store-shell">
        <h2 className="text-xl font-extrabold tracking-[-.02em] sm:text-2xl">
          {heading}
        </h2>
        <div className="scrollbar-none -mx-4 mt-6 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group w-32 shrink-0 sm:w-40"
            >
              <span className="relative block aspect-square overflow-hidden rounded-2xl bg-white shadow-[0_5px_16px_rgba(25,31,40,.08)]">
                {item.image ? (
                  <SafeImage
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 8rem, 10rem"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  />
                ) : (
                  <MediaPlaceholder />
                )}
              </span>
              <span className="mt-2 line-clamp-2 block text-xs font-bold leading-snug text-ink transition-colors group-hover:text-primary">
                {locale === "ko" && item.titleKo ? item.titleKo : item.titleEn}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
