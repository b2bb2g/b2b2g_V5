import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus, menuTitle } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { BOARD_TYPES } from "@/lib/constants";

// Premium multi-column footer: brand + get-started, marketplace and resource
// navigation split by board type, legal links, and a bottom bar.
export async function Footer() {
  const [{ t, locale }, menus, session] = await Promise.all([
    getT(),
    getVisibleMenus(),
    getSession(),
  ]);

  const isResource = (boardType: string) => boardType === BOARD_TYPES.NOTICE;
  const marketplaceLinks = menus
    .filter((menu) => !isResource(menu.board_type))
    .map((menu) => ({ href: `/${menu.slug}`, label: menuTitle(menu, locale) }));
  const resourceLinks = menus
    .filter((menu) => isResource(menu.board_type))
    .map((menu) => ({ href: `/${menu.slug}`, label: menuTitle(menu, locale) }));

  const columns = [
    { title: t.footer.marketplace, links: marketplaceLinks },
    ...(resourceLinks.length > 0
      ? [{ title: t.footer.resources, links: resourceLinks }]
      : []),
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
    <footer className="site-footer mt-auto bg-[#0b1220] text-white">
      <div className="site-shell">
        <div className="grid gap-10 border-b border-white/10 py-12 sm:py-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-[-.02em] text-white">
                {t.common.siteName}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              {t.footer.tagline}
            </p>
            <Link
              href={session.userId ? "/dashboard" : "/signup"}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-white/90"
            >
              {session.userId ? t.dashboard.title : t.footer.getStarted}
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-white/45">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
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
        </div>

        <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">{t.footer.copyright}</p>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/60">
            {t.home.eyebrow}
          </p>
        </div>
      </div>
    </footer>
  );
}
