import { getT } from "@/lib/i18n/server";

export default async function VerifyPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-strong" aria-hidden="true">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-extrabold">{t.auth.verifyTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.auth.verifyBody}</p>
    </div>
  );
}
