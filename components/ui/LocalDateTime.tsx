"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/constants";

// Hydration-safe timestamp for client components: server and first client
// render agree on a deterministic UTC format, then an effect swaps in the
// viewer's own timezone.
export function LocalDateTime({
  value,
  locale,
  className,
}: {
  value: string;
  locale: Locale;
  className?: string;
}) {
  const [label, setLabel] = useState(() =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value)),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLabel(
        new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value)),
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [value, locale]);

  return (
    <time dateTime={value} className={className}>
      {label}
    </time>
  );
}
