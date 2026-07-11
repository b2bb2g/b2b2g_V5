import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus, menuTitle } from "@/lib/data/menus";

// Multi-column footer aligned to the content container width (max-w-6xl,
// same as the landing sections).
export async function Footer() {
  const [{ t, locale }, menus] = await Promise.all([getT(), getVisibleMenus()]);

  const columns = [
    {
      title: t.footer.marketplace,
      links: menus.slice(0, 5).map((menu) => ({
        href: `/${menu.slug}`,
        label: menuTitle(menu, locale),
      })),
    },
    {
      title: t.footer.legal,
      links: [
        { href: "/legal/terms", label: t.footer.terms },
        { href: "/legal/privacy", label: t.footer.privacy },
        { href: "/legal/cookies", label: t.footer.cookies },
      ],
    },
  ];

  return (
    <footer className="site-footer mt-auto bg-[#101923] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 py-10 sm:grid-cols-[1.6fr_1fr_1fr] sm:gap-8 sm:py-14">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-base font-extrabold text-white">
                {t.common.siteName}
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/60">
              {t.footer.tagline}
            </p>
          </div>

          {columns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="hidden sm:block"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-white/55">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/65 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label={t.footer.legal} className="sm:hidden">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {columns[1].links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs font-semibold text-white/65"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-white/10 py-4 sm:py-5">
          <p className="text-xs text-white/55">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
