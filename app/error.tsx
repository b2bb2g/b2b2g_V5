"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/constants";

const subscribeToDocumentLanguage = () => () => {};

function getDocumentLanguage(): Locale {
  return document.documentElement.lang === "ko" ? "ko" : "en";
}

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = useSyncExternalStore<Locale>(
    subscribeToDocumentLanguage,
    getDocumentLanguage,
    () => "en" as const,
  );
  useEffect(() => {
    console.error(error);
    // Report to the admin error log (best-effort).
    void fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || String(error),
        stack: error.stack?.slice(0, 4000),
        url: window.location.pathname + window.location.search,
      }),
    }).catch(() => {});
  }, [error]);
  const t = getDictionary(locale);

  return (
    <div className="wide flex min-h-[60vh] items-center justify-center py-16">
      <section className="max-w-lg rounded-[2rem] border border-line bg-white p-8 text-center shadow-(--shadow-card)">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-negative-soft text-xl font-extrabold text-negative">
          !
        </span>
        <h1 className="mt-5 text-2xl font-extrabold">{t.common.errorTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{t.common.error}</p>
        <button onClick={() => unstable_retry()} className="btn-primary btn-md mt-6">
          {t.common.tryAgain}
        </button>
      </section>
    </div>
  );
}
