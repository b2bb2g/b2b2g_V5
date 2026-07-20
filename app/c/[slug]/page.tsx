import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus } from "@/lib/data/menus";
import { createClient } from "@/lib/supabase/server";
import { postMediaUrl } from "@/lib/media";
import { BadgePill } from "@/components/ui/Badge";
import { MediaGallery } from "@/components/post/MediaGallery";
import { ProductCard } from "@/components/marketplace/ProductCard";
import type { Metadata } from "next";
import type { PostTeaser } from "@/lib/types";

// Public mini homepage (PRD 5.2 / DESIGN A9): fully public promotion, all
// contact funnels through the platform inquiry gate. No contact data here.
async function getHomepage(slug: string) {
  const supabase = await createClient();
  const { data: homepage } = await supabase
    .from("mini_homepages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!homepage) return null;

  const [{ data: owner }, { data: badges }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, uid, display_name, company_name")
      .eq("id", homepage.profile_id)
      .maybeSingle(),
    supabase
      .from("member_badges")
      .select("badge_types(code, name_en, name_ko)")
      .eq("profile_id", homepage.profile_id),
  ]);
  if (!owner) return null;

  const { data: posts } = await supabase
    .from("public_posts")
    .select("*")
    .eq("author_uid", owner.uid)
    .order("published_at", { ascending: false })
    .limit(24);

  return {
    homepage,
    owner,
    badges: (badges ?? [])
      .map((b) => (b as unknown as { badge_types: { code: string; name_en: string; name_ko: string } | null }).badge_types)
      .filter((x): x is { code: string; name_en: string; name_ko: string } => !!x),
    posts: (posts as PostTeaser[]) ?? [],
  };
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await getHomepage(slug);
  if (!data) return {};
  const title = data.owner.company_name ?? data.owner.display_name ?? slug;
  return {
    title,
    description: data.homepage.intro_en.slice(0, 160),
    openGraph: {
      title,
      description: data.homepage.intro_en.slice(0, 160),
      ...(data.homepage.cover_image_path
        ? { images: [postMediaUrl(data.homepage.cover_image_path)] }
        : {}),
    },
  };
}

export default async function CompanyPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const [{ t, locale }, session, data, menus] = await Promise.all([
    getT(),
    getSession(),
    getHomepage(slug),
    getVisibleMenus(),
  ]);
  if (!data) notFound();
  const menuSlugById = new Map(menus.map((menu) => [menu.id, menu.slug]));

  const { homepage, owner, badges, posts } = data;
  const companyName = owner.company_name ?? owner.display_name ?? slug;
  const intro =
    locale === "ko" && homepage.intro_ko ? homepage.intro_ko : homepage.intro_en;
  const isOwn = session.userId === owner.id;
  const docs = (homepage.doc_paths as { path: string; name: string }[]) ?? [];
  const gallery = ((homepage.gallery_paths as string[]) ?? []).map(postMediaUrl);
  const certs = (homepage.cert_paths as { path: string; name: string }[]) ?? [];

  return (
    <article className="space-y-6">
      {homepage.cover_image_path ? (
        <header className="relative overflow-hidden rounded-[1.75rem] bg-[#101923] shadow-[0_20px_60px_rgba(25,31,40,.14)]">
          <div className="relative aspect-[16/8] sm:aspect-[16/6]">
            <Image
              src={postMediaUrl(homepage.cover_image_path)}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
            <span
              className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-black/12"
              aria-hidden="true"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
            <h1 className="line-clamp-2 text-2xl font-extrabold leading-snug tracking-[-.02em] sm:text-3xl">
              {companyName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {badges.map((b) => (
                <BadgePill
                  key={b.code}
                  code={b.code}
                  label={locale === "ko" ? b.name_ko : b.name_en}
                />
              ))}
              <Link
                href={`/u/${owner.uid}`}
                className="rounded-full bg-white/14 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/22"
              >
                UID:{owner.uid}
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <header className="rounded-[1.75rem] bg-[#101923] p-6 text-white sm:p-8">
          <h1 className="text-2xl font-extrabold leading-snug tracking-[-.02em] sm:text-3xl">
            {companyName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {badges.map((b) => (
              <BadgePill
                key={b.code}
                code={b.code}
                label={locale === "ko" ? b.name_ko : b.name_en}
              />
            ))}
            <Link
              href={`/u/${owner.uid}`}
              className="rounded-full bg-white/14 px-2.5 py-0.5 text-xs font-bold text-white transition hover:bg-white/22"
            >
              UID:{owner.uid}
            </Link>
          </div>
        </header>
      )}

      <div className="rounded-[1.5rem] border border-line/80 bg-white p-5 shadow-(--shadow-card) sm:p-6">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {intro}
        </p>
      </div>

      {gallery.length > 0 && (
        <section>
          <h2 className="text-base font-bold">{t.homepage.gallery}</h2>
          <div className="mt-2">
            <MediaGallery
              images={gallery}
              heroIndex={0}
              showHero={false}
              title={companyName}
              closeLabel={t.common.close}
            />
          </div>
        </section>
      )}

      {certs.length > 0 && (
        <section>
          <h2 className="text-base font-bold">{t.homepage.certificates}</h2>
          <ul className="mt-2 space-y-1.5">
            {certs.map((doc) => (
              <li key={doc.path}>
                <a
                  href={postMediaUrl(doc.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-primary-strong hover:bg-primary-soft/40"
                >
                  {doc.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {docs.length > 0 && (
        <section>
          <h2 className="text-base font-bold">{t.homepage.docs}</h2>
          <ul className="mt-2 space-y-1.5">
            {docs.map((doc) => (
              <li key={doc.path}>
                <a
                  href={postMediaUrl(doc.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-primary-strong hover:bg-primary-soft/40"
                >
                  {doc.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <h2 className="text-base font-bold">{t.homepage.companyPosts}</h2>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
            {posts.map((post, index) => (
              <ProductCard
                key={post.id}
                post={post}
                href={`/${menuSlugById.get(post.menu_id) ?? "industrial"}/${post.id}`}
                locale={locale}
                priority={index < 3}
              />
            ))}
          </div>
        </section>
      )}

      {/* Single contact funnel: platform inquiry, sign-up gate for visitors */}
      {!isOwn && (
        <div className="sticky bottom-4">
          <Link
            href={
              session.userId
                ? `/inquiries/new?to=${owner.id}`
                : `/login?next=/inquiries/new?to=${owner.id}`
            }
            className="block w-full rounded-xl bg-primary px-4 py-3.5 text-center text-sm font-bold text-white shadow-lg hover:bg-primary-strong"
          >
            {t.homepage.inquireCompany}
          </Link>
        </div>
      )}
    </article>
  );
}
