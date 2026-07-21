import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CookiePreferences } from "@/components/legal/CookiePreferences";
import { getPublicSettings, settingString } from "@/lib/data/settings";
import { getT } from "@/lib/i18n/server";
import {
  getLegalDocument,
  getLegalUi,
  LEGAL_SLUGS,
  type LegalSection,
  type LegalSlug,
} from "@/lib/legal-documents";

const DEFAULT_EFFECTIVE_DATE = "2026-07-21";
const DEFAULT_VERSION = "1.1";

function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(slug);
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  if (!isLegalSlug(slug)) return {};

  const { locale } = await getT();
  const document = getLegalDocument(locale, slug);
  return {
    title: document.title,
    description: document.summary,
    alternates: { canonical: `/legal/${slug}` },
    robots: { index: true, follow: true },
  };
}

function LegalSectionContent({ section }: { section: LegalSection }) {
  return (
    <section
      id={section.id}
      className="scroll-mt-28 border-t border-line/80 py-8 first:border-t-0 first:pt-0 sm:py-10"
    >
      <h2 className="text-xl font-semibold leading-snug tracking-[-.025em] text-ink sm:text-2xl">
        {section.title}
      </h2>

      {section.paragraphs?.map((paragraph) => (
        <p
          key={paragraph.slice(0, 48)}
          className="mt-4 text-[0.9375rem] leading-7 text-ink-soft sm:text-base sm:leading-8"
        >
          {paragraph}
        </p>
      ))}

      {section.items && (
        <ul className="mt-5 space-y-3 pl-5 text-[0.9375rem] leading-7 text-ink-soft marker:text-primary sm:text-base sm:leading-8">
          {section.items.map((item) => (
            <li key={item.slice(0, 48)} className="list-disc pl-1.5">
              {item}
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead className="bg-surface-sub">
                <tr>
                  {section.table.headers.map((header) => (
                    <th
                      key={header}
                      className="border-b border-line px-4 py-3 text-xs font-bold text-ink sm:px-5"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map((row, rowIndex) => (
                  <tr key={`${section.id}-${rowIndex}`} className="align-top">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${section.id}-${rowIndex}-${cellIndex}`}
                        className="border-b border-line/70 px-4 py-4 text-sm leading-6 text-ink-soft last:border-b-0 sm:px-5"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default async function LegalPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  if (!isLegalSlug(slug)) notFound();

  const [{ t, locale }, settings] = await Promise.all([
    getT(),
    getPublicSettings(),
  ]);
  const document = getLegalDocument(locale, slug);
  const ui = getLegalUi(locale);
  const effectiveDate = settingString(
    settings,
    "legal_policy_effective_date",
    DEFAULT_EFFECTIVE_DATE,
  );
  const version = settingString(
    settings,
    "legal_policy_version",
    DEFAULT_VERSION,
  );
  const operator = settingString(settings, "legal_operator_name", "B2BB2G");
  const privacyDepartment = settingString(
    settings,
    "legal_privacy_department",
    locale === "ko" ? "B2BB2G 운영팀" : "B2BB2G Operations",
  );
  const contactPath = settingString(
    settings,
    "legal_contact_path",
    "/inquiries",
  );
  const navigation = [
    { slug: "terms" as const, label: t.footer.terms },
    { slug: "privacy" as const, label: t.footer.privacy },
    { slug: "cookies" as const, label: t.footer.cookies },
  ];

  return (
    <div className="wide py-5 sm:py-8 lg:py-12">
      <nav
        aria-label={ui.documentNavigation}
        className="mb-6 flex gap-2 overflow-x-auto pb-1 sm:mb-8"
      >
        {navigation.map((item) => (
          <Link
            key={item.slug}
            href={`/legal/${item.slug}`}
            aria-current={item.slug === slug ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              item.slug === slug
                ? "bg-ink text-white"
                : "border border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <header className="relative overflow-hidden rounded-[2rem] bg-[#0c1622] px-6 py-10 text-white shadow-[0_22px_70px_rgba(15,23,42,.14)] sm:px-10 sm:py-14 lg:px-14">
        <span
          aria-hidden="true"
          className="absolute -right-24 -top-40 h-96 w-96 rounded-full bg-primary/30 blur-3xl"
        />
        <div className="relative max-w-4xl">
          <p className="text-xs font-bold tracking-[0.2em] text-[#75afff]">
            {document.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-5xl lg:text-6xl">
            {document.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            {document.summary}
          </p>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/12 pt-5 text-sm text-white/62">
            <span>
              {ui.effectiveDate}{" "}
              <strong className="font-semibold text-white">{effectiveDate}</strong>
            </span>
            <span>
              {ui.version}{" "}
              <strong className="font-semibold text-white">{version}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <article className="min-w-0 rounded-[2rem] border border-line/80 bg-white px-5 py-8 shadow-[0_16px_50px_rgba(25,31,40,.05)] sm:px-8 sm:py-10 lg:px-10">
          <p className="mb-8 rounded-2xl border border-primary/15 bg-primary-soft px-4 py-3 text-sm leading-6 text-ink-soft">
            {ui.importantNotice}
          </p>

          {document.sections.map((section) => (
            <LegalSectionContent key={section.id} section={section} />
          ))}

          {slug === "cookies" && (
            <div className="border-t border-line/80 pt-8 sm:pt-10">
              <CookiePreferences
                labels={{
                  title: t.cookie.preferencesTitle,
                  essential: t.cookie.essentialLabel,
                  analytics: t.cookie.analyticsLabel,
                  save: t.common.save,
                }}
              />
            </div>
          )}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-[1.5rem] border border-line bg-white p-5 shadow-[0_12px_40px_rgba(25,31,40,.05)]">
            <h2 className="text-sm font-bold text-ink">{ui.contents}</h2>
            <ol className="mt-4 space-y-2.5">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block text-xs leading-5 text-ink-soft transition-colors hover:text-primary"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[1.5rem] bg-[#0c1622] p-5 text-white shadow-[0_16px_45px_rgba(15,23,42,.15)]">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-white/48">{ui.operator}</dt>
                <dd className="mt-1 font-semibold">{operator}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/48">
                  {ui.privacyDepartment}
                </dt>
                <dd className="mt-1 font-semibold">{privacyDepartment}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/48">{ui.contactChannel}</dt>
                <dd className="mt-1 break-all font-mono text-xs text-white/80">
                  {contactPath}
                </dd>
              </div>
            </dl>
            <Link
              href={contactPath}
              className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
            >
              {ui.contactAction}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
