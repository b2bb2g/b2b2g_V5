import Link from "next/link";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { postMediaUrl } from "@/lib/media";
import { BADGE_CODES } from "@/lib/constants";

// Mini homepage VIEW (UX convention: read first, edit behind a button).
export default async function HomepageViewPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);

  const certified = session.badges.some(
    (b) => b.badge_types?.code === BADGE_CODES.CERTIFIED,
  );

  if (!certified) {
    return (
      <div className="space-y-5">
        <PageHeader title={t.homepage.title} description={t.homepage.overview} />
        <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-line/70 bg-white px-6 py-14 text-center shadow-(--shadow-card)">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="11" x="5" y="11" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            {t.homepage.needCertified}
          </p>
          <Link href="/dashboard/badges" className="btn-primary btn-md">
            {t.dashboard.subCta}
          </Link>
        </div>
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
      <div className="space-y-5">
        <PageHeader title={t.homepage.title} description={t.homepage.overview} />
        <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-line/70 bg-white px-6 py-14 text-center shadow-(--shadow-card)">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" />
            </svg>
          </span>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            {t.homepage.slugHint}
          </p>
          <Link href="/dashboard/homepage/edit" className="btn-primary btn-md">
            {t.common.add}
          </Link>
        </div>
      </div>
    );
  }

  const docs = (homepage.doc_paths as { path: string; name: string }[]) ?? [];
  const intro =
    locale === "ko" && homepage.intro_ko
      ? homepage.intro_ko
      : homepage.intro_en;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.homepage.title}
        description={t.homepage.overview}
        action={
          <Link href="/dashboard/homepage/edit" className="btn-primary btn-md">
            {t.common.edit}
          </Link>
        }
      />

      <div className="space-y-4 rounded-[1.5rem] border border-line/70 bg-white p-5 shadow-(--shadow-card) sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-ink-soft">
            /c/{homepage.slug}
          </p>
          <StatusLabel
            status={homepage.is_published ? "approved" : "draft"}
            label={
              homepage.is_published
                ? t.homepage.published
                : t.homepage.notPublished
            }
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
