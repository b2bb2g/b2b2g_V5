import { getT } from "@/lib/i18n/server";
import Link from "next/link";

export async function Footer() {
  const { t } = await getT();
  return (
    <footer className="mt-auto border-t border-line bg-surface-sub/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-extrabold text-white">
              B
            </span>
            <p className="text-sm font-extrabold text-ink">{t.common.siteName}</p>
          </div>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-faint">
            {t.footer.tagline}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft">
            <Link href="/legal/terms" className="hover:text-ink">{t.footer.terms}</Link>
            <Link href="/legal/privacy" className="hover:text-ink">{t.footer.privacy}</Link>
            <Link href="/legal/cookies" className="hover:text-ink">{t.footer.cookies}</Link>
            <Link href="/membership" className="hover:text-ink">{t.dashboard.subCta}</Link>
          </nav>
          <p className="text-xs text-ink-faint">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
