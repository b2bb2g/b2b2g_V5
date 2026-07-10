import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus } from "@/lib/data/menus";
import { createClient } from "@/lib/supabase/server";
import { postMediaUrl, videoThumbnail } from "@/lib/media";
import { BadgePill } from "@/components/ui/Badge";
import type { Metadata } from "next";
import type { PostTeaser } from "@/lib/types";

// Public member profile (DESIGN C2): UID, badges, public posts. Never any
// contact details (PRD 9) — the inquiry button is the only contact path.
async function getPublicProfile(uid: number) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, uid, display_name, company_name, bio, created_at")
    .eq("uid", uid)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: badges }, { data: homepage }, { data: posts }] = await Promise.all([
    supabase
      .from("member_badges")
      .select("badge_types(code, name_en, name_ko)")
      .eq("profile_id", profile.id),
    supabase
      .from("mini_homepages")
      .select("slug")
      .eq("profile_id", profile.id)
      .eq("is_published", true)
      .maybeSingle(),
    supabase
      .from("public_posts")
      .select("*")
      .eq("author_uid", profile.uid)
      .order("published_at", { ascending: false })
      .limit(24),
  ]);

  return {
    profile,
    badges: (badges ?? [])
      .map((b) => (b as unknown as { badge_types: { code: string; name_en: string; name_ko: string } | null }).badge_types)
      .filter((x): x is { code: string; name_en: string; name_ko: string } => !!x),
    homepageSlug: homepage?.slug ?? null,
    posts: (posts as PostTeaser[]) ?? [],
  };
}

export async function generateMetadata(props: {
  params: Promise<{ uid: string }>;
}): Promise<Metadata> {
  const { uid } = await props.params;
  const data = await getPublicProfile(Number(uid));
  if (!data) return {};
  const title =
    data.profile.company_name ?? data.profile.display_name ?? `UID ${uid}`;
  return { title, description: data.profile.bio?.slice(0, 160) };
}

export default async function PublicProfilePage(props: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await props.params;
  const parsedUid = Number(uid);
  if (!Number.isInteger(parsedUid) || parsedUid <= 0) notFound();

  const [{ t, locale }, session, data, menus] = await Promise.all([
    getT(),
    getSession(),
    getPublicProfile(parsedUid),
    getVisibleMenus(),
  ]);
  if (!data) notFound();

  const { profile, badges, homepageSlug, posts } = data;
  const name = profile.company_name ?? profile.display_name ?? `UID ${profile.uid}`;
  const isOwn = session.userId === profile.id;
  const menuSlugById = new Map(menus.map((menu) => [menu.id, menu.slug]));

  return (
    <article className="space-y-6">
      <header className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-xl font-extrabold text-primary-strong">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold leading-snug">{name}</h1>
          <p className="mt-0.5 text-xs text-ink-faint">
            {t.admin.uid} {profile.uid} · {t.admin.joined}{" "}
            {new Date(profile.created_at).toISOString().slice(0, 10)}
          </p>
          {badges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {badges.map((b) => (
                <BadgePill
                  key={b.code}
                  code={b.code}
                  label={locale === "ko" ? b.name_ko : b.name_en}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      {profile.bio && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {profile.bio}
        </p>
      )}

      {homepageSlug && (
        <Link href={`/c/${homepageSlug}`} className="btn-secondary btn-md w-full">
          {t.homepage.title}
        </Link>
      )}

      {posts.length > 0 && (
        <section>
          <h2 className="section-title">{t.homepage.companyPosts}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {posts.map((post) => {
              const thumb = post.rep_image_path
                ? postMediaUrl(post.rep_image_path)
                : post.rep_video_url
                  ? videoThumbnail(post.rep_video_url)
                  : null;
              return (
                <Link
                  key={post.id}
                  href={`/${menuSlugById.get(post.menu_id) ?? "industrial"}/${post.id}`}
                  className="card-hover group overflow-hidden"
                >
                  <div className="relative aspect-square bg-surface-sub">
                    {thumb && (
                      <Image
                        src={thumb}
                        alt={post.title_en}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition-transform group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <p className="line-clamp-2 p-3 text-sm font-bold leading-snug">
                    {locale === "ko" && post.title_ko ? post.title_ko : post.title_en}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {!isOwn && (
        <div className="sticky bottom-4">
          <Link
            href={
              session.userId
                ? `/inquiries/new?to=${profile.id}`
                : `/login?next=/inquiries/new?to=${profile.id}`
            }
            className="btn-primary btn-lg w-full shadow-(--shadow-float)"
          >
            {t.homepage.inquireCompany}
          </Link>
        </div>
      )}
    </article>
  );
}
