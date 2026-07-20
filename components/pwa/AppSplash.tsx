"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Branded launch splash for the installed app. Android already shows an
// OS-generated splash from the manifest; this overlay carries the same
// look through first paint and gives iOS (which shows none) a real one.
// Shown once per app session, only in standalone display mode.
const SESSION_KEY = "b2bb2g:splash-shown";

export function AppSplash() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "leaving">(
    "hidden",
  );

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (!standalone) return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      return;
    }
    const show = setTimeout(() => setPhase("visible"), 0);
    const leave = setTimeout(() => setPhase("leaving"), 1100);
    const done = setTimeout(() => setPhase("hidden"), 1600);
    return () => {
      clearTimeout(show);
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[400] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
    >
      <Image
        src="/icons/b2bb2g-icon-192.png"
        alt=""
        width={96}
        height={96}
        priority
        className="h-24 w-24 rounded-[1.6rem] shadow-[0_18px_50px_rgba(27,100,218,.25)] motion-safe:animate-[splash-pop_.7s_cubic-bezier(.2,.8,.25,1)_both]"
      />
      <p className="mt-5 text-xl font-extrabold tracking-[-.02em] text-ink motion-safe:animate-[splash-rise_.7s_.15s_cubic-bezier(.2,.8,.25,1)_both]">
        B2BB2G
      </p>
      <p className="mt-1 text-xs font-semibold text-ink-faint motion-safe:animate-[splash-rise_.7s_.25s_cubic-bezier(.2,.8,.25,1)_both]">
        Global B2B · B2G Marketplace
      </p>
    </div>
  );
}
