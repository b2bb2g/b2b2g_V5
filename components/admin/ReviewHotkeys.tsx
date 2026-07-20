"use client";

import { useEffect } from "react";

// Keyboard driving for moderation queues: J/K (or arrows) walk the cards,
// A fires the primary approve action, R opens the reject step. Typing in
// any field suspends the shortcuts. Cards opt in with data-review-card and
// a tabIndex so focus is the cursor.
export function ReviewHotkeys({ hint }: { hint: string }) {
  useEffect(() => {
    const cards = () =>
      [...document.querySelectorAll<HTMLElement>("[data-review-card]")];
    const currentIndex = () => {
      const active = document.activeElement;
      return cards().findIndex((card) => card.contains(active));
    };
    const move = (direction: 1 | -1) => {
      const list = cards();
      if (!list.length) return;
      const next = Math.min(
        list.length - 1,
        Math.max(0, currentIndex() + direction),
      );
      list[next].focus();
      list[next].scrollIntoView({ block: "center", behavior: "smooth" });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        move(1);
      } else if (key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        move(-1);
      } else if (key === "a" || key === "r") {
        const index = currentIndex();
        if (index < 0) return;
        event.preventDefault();
        cards()
          [index].querySelector<HTMLElement>(
            key === "a" ? "[data-review-approve]" : "[data-review-reject]",
          )
          ?.click();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <p className="hidden items-center gap-1.5 text-[11px] font-semibold text-ink-faint lg:flex">
      {hint}
    </p>
  );
}
