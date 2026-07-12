"use client";

import en from "@/lib/i18n/locales/en";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main style={{ margin: "10vh auto", maxWidth: 520, padding: 24, textAlign: "center", fontFamily: "sans-serif" }}>
          <h1>{en.common.errorTitle}</h1>
          <p>{en.common.error}</p>
          <button type="button" onClick={() => unstable_retry()} style={{ marginTop: 16, padding: "12px 20px" }}>
            {en.common.tryAgain}
          </button>
        </main>
      </body>
    </html>
  );
}
