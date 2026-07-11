import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { BrandMark } from "@/components/brand/BrandMark";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Auth screens share a centered card with the brand mark on top.
// Core auth actions steer out of in-app browsers (PRD 13).
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getT();
  return (
    <div className="auth-shell full-bleed grid min-h-screen-safe bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.8fr)]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_20%_15%,rgba(49,130,246,.55),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(49,130,246,.2),transparent_34%)]" />
        <Link href="/" className="relative flex items-center gap-3">
          <BrandMark className="h-10 w-10 ring-1 ring-white/15" />
          <span className="text-lg font-extrabold tracking-tight">{t.common.siteName}</span>
        </Link>
        <div className="relative max-w-xl">
          <p className="text-4xl font-extrabold leading-tight tracking-[-0.035em]">{t.auth.valueTitle}</p>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65">{t.auth.valueBody}</p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[t.auth.valuePoint1, t.auth.valuePoint2, t.auth.valuePoint3].map((point, index) => (
              <div key={point} className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
                <span className="text-xs font-bold text-primary">0{index + 1}</span>
                <p className="mt-6 text-sm font-bold leading-snug">{point}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/35">{t.footer.copyright}</p>
      </aside>
      <section className="flex min-h-screen-safe flex-col px-5 py-5 sm:px-10 lg:px-16 lg:py-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <BrandMark className="h-9 w-9" />
            <span className="font-extrabold">{t.common.siteName}</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">{t.auth.backHome}</Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-8">{children}</div>
      </section>
    </div>
  );
}
