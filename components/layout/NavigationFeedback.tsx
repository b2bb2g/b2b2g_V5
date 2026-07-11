"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPending(false), 0);
  }, [pathname, searchParams]);

  useEffect(() => {
    function start() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPending(true), 100);
    }
    function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.download || anchor.origin !== location.origin) return;
      const next = new URL(anchor.href);
      if (`${next.pathname}${next.search}` !== `${location.pathname}${location.search}`) start();
    }
    function submit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement;
      if ((form.method || "get").toLowerCase() === "get") start();
    }
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}
      role="progressbar"
      aria-label="Loading"
      aria-hidden={!pending}
    >
      <span className="block h-full w-1/3 animate-navigation-progress bg-primary" />
    </div>
  );
}
