import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { HomepageEditor } from "@/components/homepage/HomepageEditor";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { BADGE_CODES } from "@/lib/constants";

export default async function HomepageSettingsPage(props: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);

  const certified = session.badges.some(
    (b) => b.badge_types?.code === BADGE_CODES.CERTIFIED
  );

  if (!certified) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <h1 className="text-xl font-extrabold">{t.homepage.title}</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          {t.homepage.needCertified}
        </p>
        <Link
          href="/dashboard/badges"
          className="inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-strong"
        >
          {t.dashboard.subCta}
        </Link>
      </div>
    );
  }

  const { data: homepage } = await supabase
    .from("mini_homepages")
    .select("*")
    .eq("profile_id", session.userId)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">{t.homepage.title}</h1>
        {homepage && (
          <StatusLabel
            status={homepage.is_published ? "approved" : "draft"}
            label={homepage.is_published ? t.homepage.published : t.homepage.notPublished}
          />
        )}
      </div>

      {params.saved && (
        <p className="rounded-lg bg-positive-soft px-3 py-2 text-xs font-semibold text-positive">
          {t.homepage.saved}
        </p>
      )}

      {homepage?.is_published && (
        <Link
          href={`/c/${homepage.slug}`}
          className="inline-block text-sm font-semibold text-primary"
        >
          {t.homepage.visit}
        </Link>
      )}

      <HomepageEditor
        t={t}
        userId={session.userId}
        initial={{
          slug: homepage?.slug ?? "",
          introEn: homepage?.intro_en ?? "",
          introKo: homepage?.intro_ko ?? "",
          coverImagePath: homepage?.cover_image_path ?? null,
          docPaths: (homepage?.doc_paths as { path: string; name: string }[]) ?? [],
          customDomain: homepage?.custom_domain ?? "",
          isPublished: homepage?.is_published ?? false,
        }}
      />
    </div>
  );
}
