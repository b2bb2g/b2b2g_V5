import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { postMediaUrl } from "@/lib/media";
import { BADGE_CODES } from "@/lib/constants";

// Mini homepage VIEW (UX convention: read first, edit behind a button).
export default async function HomepageViewPage(props: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t, locale }, params, supabase] = await Promise.all([
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
        <h1 className="text-2xl font-extrabold tracking-tight">{t.homepage.title}</h1>
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

  if (!homepage) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.homepage.title}</h1>
        <p className="text-sm leading-relaxed text-ink-soft">{t.homepage.slugHint}</p>
        <Link
          href="/dashboard/homepage/edit"
          className="inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-strong"
        >
          {t.common.add}
        </Link>
      </div>
    );
  }

  const docs = (homepage.doc_paths as { path: string; name: string }[]) ?? [];
  const intro =
    locale === "ko" && homepage.intro_ko ? homepage.intro_ko : homepage.intro_en;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader
        title={t.homepage.title}
        action={
          <Link href="/dashboard/homepage/edit" className="btn-primary btn-md">
            {t.common.edit}
          </Link>
        }
      />

      {params.saved && (
        <p className="rounded-lg bg-positive-soft px-3 py-2 text-xs font-semibold text-positive">
          {t.homepage.saved}
        </p>
      )}

      <div className="space-y-4 rounded-card border border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-ink-soft">/c/{homepage.slug}</p>
          <StatusLabel
            status={homepage.is_published ? "approved" : "draft"}
            label={homepage.is_published ? t.homepage.published : t.homepage.notPublished}
          />
        </div>

        {homepage.cover_image_path && (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-sub">
            <Image
              src={postMediaUrl(homepage.cover_image_path)}
              alt=""
              fill
              sizes="512px"
              className="object-cover"
            />
          </div>
        )}

        <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {intro}
        </p>

        {docs.length > 0 && (
          <p className="text-xs text-ink-faint">
            {t.homepage.docs}: {docs.length}
          </p>
        )}

        {homepage.custom_domain && (
          <p className="text-xs text-ink-faint">
            {t.homepage.customDomain}: {homepage.custom_domain}
          </p>
        )}
      </div>

      {homepage.is_published && (
        <Link
          href={`/c/${homepage.slug}`}
          className="block w-full rounded-xl bg-surface-sub px-4 py-3 text-center text-sm font-semibold text-ink-soft hover:bg-line/60"
        >
          {t.homepage.visit}
        </Link>
      )}
    </div>
  );
}
