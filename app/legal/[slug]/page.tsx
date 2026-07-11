import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { CookiePreferences } from "@/components/legal/CookiePreferences";
import type { Metadata } from "next";

// Legal pages: draft baseline copy (final wording pending, PRD 19.6).
// Includes the message-access disclosure required by PRD 16.5.
const SLUGS = ["terms", "privacy", "cookies"] as const;
type Slug = (typeof SLUGS)[number];

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const { t } = await getT();
  const titles: Record<string, string> = {
    terms: t.footer.terms,
    privacy: t.footer.privacy,
    cookies: t.footer.cookies,
  };
  return { title: titles[slug] };
}

export default async function LegalPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  if (!(SLUGS as readonly string[]).includes(slug)) notFound();

  const { t } = await getT();
  const titles: Record<Slug, string> = {
    terms: t.footer.terms,
    privacy: t.footer.privacy,
    cookies: t.footer.cookies,
  };
  const bodies: Record<Slug, string[]> = {
    terms: t.legal.terms,
    privacy: t.legal.privacy,
    cookies: t.legal.cookies,
  };

  return (
    <div className="space-y-5 py-2">
      <PageHeader title={titles[slug as Slug]} subtitle={t.legal.draftNotice} />
      <div className="space-y-4">
        {bodies[slug as Slug].map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-ink-soft">
            {paragraph}
          </p>
        ))}
      </div>

      {slug === "cookies" && (
        <CookiePreferences
          labels={{
            title: t.cookie.preferencesTitle,
            essential: t.cookie.essentialLabel,
            analytics: t.cookie.analyticsLabel,
            save: t.common.save,
          }}
        />
      )}
    </div>
  );
}
