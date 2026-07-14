"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/constants";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const clockListeners = new Set<() => void>();
let clockNow = Date.now();
let clockTimer: number | null = null;

function subscribeToClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockTimer === null) {
    clockNow = Date.now();
    clockTimer = window.setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((notify) => notify());
    }, MINUTE);
  }

  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== null) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

export function RelativeTime({
  dateTime,
  locale,
  initialNow,
  justNowLabel,
  className,
}: {
  dateTime: string;
  locale: Locale;
  initialNow: string;
  justNowLabel: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.parse(initialNow));

  useEffect(() => {
    return subscribeToClock(() => setNow(clockNow));
  }, []);

  const { label, title } = useMemo(
    () => formatFeedTime(dateTime, now, locale, justNowLabel),
    [dateTime, justNowLabel, locale, now],
  );

  return (
    <time dateTime={dateTime} title={title} className={className}>
      {label}
    </time>
  );
}

function formatFeedTime(
  dateTime: string,
  now: number,
  locale: Locale,
  justNowLabel: string,
) {
  const createdAt = Date.parse(dateTime);
  const date = new Date(createdAt);
  const title = Number.isFinite(createdAt)
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : dateTime;

  if (!Number.isFinite(createdAt) || !Number.isFinite(now)) {
    return { label: dateTime, title };
  }

  const elapsed = Math.max(0, now - createdAt);
  if (elapsed < MINUTE) return { label: justNowLabel, title };

  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  if (elapsed < HOUR) {
    return {
      label: relative.format(-Math.floor(elapsed / MINUTE), "minute"),
      title,
    };
  }
  if (elapsed < DAY) {
    return {
      label: relative.format(-Math.floor(elapsed / HOUR), "hour"),
      title,
    };
  }
  if (elapsed < DAY * 7) {
    return {
      label: relative.format(-Math.floor(elapsed / DAY), "day"),
      title,
    };
  }

  const createdYear = date.getFullYear();
  const currentYear = new Date(now).getFullYear();
  return {
    label: new Intl.DateTimeFormat(locale, {
      ...(createdYear === currentYear ? {} : { year: "numeric" }),
      month: "short",
      day: "numeric",
    }).format(date),
    title,
  };
}
