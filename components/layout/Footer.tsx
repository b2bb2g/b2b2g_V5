import { getT } from "@/lib/i18n/server";
import { setLocale } from "@/app/actions/locale";
import { LOCALES } from "@/lib/constants";
import Link from "next/link";

export async function Footer() {
  const { t, locale } = await getT();
  return (
    <footer className="mt-auto border-t border-line bg-surface-sub/60">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft">
          <Link href="/legal/terms" className="hover:text-ink">{t.footer.terms}</Link>
          <Link href="/legal/privacy" className="hover:text-ink">{t.footer.privacy}</Link>
          <Link href="/legal/cookies" className="hover:text-ink">{t.footer.cookies}</Link>
        </nav>
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-faint">{t.footer.copyright}</p>
          <form action={setLocale} className="flex gap-1">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="submit"
                name="locale"
                value={l}
                className={`rounded-md px-2 py-1 text-xs font-semibold uppercase ${
                  l === locale
                    ? "bg-primary-soft text-primary-strong"
                    : "text-ink-faint hover:text-ink-soft"
                }`}
              >
                {l}
              </button>
            ))}
          </form>
        </div>
      </div>
    </footer>
  );
}
