import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";

// Multi-column footer aligned to the content container width (max-w-6xl,
// same as the landing sections).
export async function Footer() {
  const [{ t }, menus] = await Promise.all([getT(), getVisibleMenus()]);

  const columns = [
    {
      title: t.footer.marketplace,
      links: menus.slice(0, 5).map((menu) => ({
        href: `/${menu.slug}`,
        label: menu.title_en,
      })),
    },
    {
      title: t.footer.members,
      links: [
        { href: "/signup", label: t.common.signUp },
        { href: "/login", label: t.common.signIn },
        { href: "/membership", label: t.membership.title },
        { href: "/dashboard", label: t.common.dashboard },
      ],
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
    <footer className="mt-auto border-t border-line bg-surface-sub/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 py-12 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-extrabold text-white">
                B
              </span>
              <span className="text-sm font-extrabold text-ink">
                {t.common.siteName}
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink-faint">
              {t.footer.tagline}
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-line py-5">
          <p className="text-xs text-ink-faint">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
