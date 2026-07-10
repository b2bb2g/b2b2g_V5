import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";

// Placeholder legal pages; final copy is an operations deliverable (PRD 19.6).
const SLUGS = ["terms", "privacy", "cookies"] as const;

export default async function LegalPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  if (!(SLUGS as readonly string[]).includes(slug)) notFound();

  const { t } = await getT();
  const titles: Record<string, string> = {
    terms: t.footer.terms,
    privacy: t.footer.privacy,
    cookies: t.footer.cookies,
  };

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-xl font-extrabold">{titles[slug]}</h1>
      <p className="text-sm text-ink-soft">{t.common.emptyListHint}</p>
    </div>
  );
}
