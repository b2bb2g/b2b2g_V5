"use client";

import { useEffect, useState } from "react";

// Sticky in-page tabs with scroll spy: the tab whose section sits at the
// reading line is underlined, and clicking marks it immediately while the
// native anchor jump scrolls (sections carry scroll-mt for the offset).
export function SectionTabs({
  items,
  ariaLabel,
}: {
  items: { id: string; label: string }[];
  ariaLabel: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      // Just below the sticky header (4.5rem) plus the tab bar itself.
      const line = 150;
      let current = items[0]?.id ?? "";
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive((prev) => (prev === current ? prev : current));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const timer = setTimeout(measure, 0);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      clearTimeout(timer);
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <nav
      aria-label={ariaLabel}
      className="scrollbar-none sticky top-[4.5rem] z-20 -mx-1 flex overflow-x-auto border-b border-line bg-[#f7f8fa]/95 px-1 pt-1 backdrop-blur"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={isActive ? "true" : undefined}
            onClick={() => setActive(item.id)}
            className={`shrink-0 border-b-2 px-4 py-3.5 text-sm transition-colors sm:px-5 sm:py-4 ${
              isActive
                ? "border-ink font-extrabold text-ink"
                : "border-transparent font-bold text-ink-faint hover:text-ink"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
