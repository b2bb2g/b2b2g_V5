import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus } from "@/lib/data/menus";
import { createClient } from "@/lib/supabase/server";
import { BadgePill } from "@/components/ui/Badge";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { stripRichText } from "@/lib/richtext";
import { BOARD_TYPES, POST_STATUS } from "@/lib/constants";
import { postMediaUrl } from "@/lib/media";
import { listFeed } from "@/lib/data/feed";
import { FeedCard } from "@/components/feed/FeedCard";
import { getFeedCardLabels } from "@/lib/i18n/feed";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import type { Metadata } from "next";
import type { PostTeaser } from "@/lib/types";

// Public member profile (DESIGN C2): UID, badges, public posts. Never any
// contact details (PRD 9) — the inquiry button is the only contact path.
async function getPublicProfile(uid: number) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, uid, bio, bio_en, bio_ko, avatar_url, created_at")
    .eq("uid", uid)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: badges }, { data: homepage }, { data: posts }] =
    await Promise.all([
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
      .map(
        (b) =>
          (
            b as unknown as {
              badge_types: {
                code: string;
                name_en: string;
                name_ko: string;
              } | null;
            }
          ).badge_types,
      )
      .filter(
        (x): x is { code: string; name_en: string; name_ko: string } => !!x,
      ),
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
  const title = `UID:${uid}`;
  return {
    title,
    description: (data.profile.bio_en ?? data.profile.bio)?.slice(0, 160),
    alternates: { canonical: `/u/${uid}` },
  };
}

export default async function PublicProfilePage(props: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await props.params;
  const parsedUid = Number(uid);
  if (!Number.isInteger(parsedUid) || parsedUid <= 0) notFound();

  const [{ t, locale }, session, data, menus, feedItems] = await Promise.all([
    getT(),
    getSession(),
    getPublicProfile(parsedUid),
    getVisibleMenus(),
    listFeed({ authorUid: parsedUid, limit: 6 }),
  ]);
  if (!data) notFound();

  const { profile, badges, homepageSlug, posts } = data;
  const name = `UID:${profile.uid}`;
  const publicBio =
    locale === "ko"
      ? (profile.bio_ko ?? profile.bio_en ?? profile.bio)
      : (profile.bio_en ?? profile.bio);
  const isOwn = session.userId === profile.id;
  const menuSlugById = new Map(menus.map((menu) => [menu.id, menu.slug]));
  const sections = menus
    .filter((menu) => menu.slug !== "notices")
    .map((menu) => ({
      menu,
      posts: posts.filter((post) => post.menu_id === menu.id),
    }))
    .filter((section) => section.posts.length > 0);

  return (
    <article className="wide space-y-10">
      <header className="relative min-h-72 overflow-hidden rounded-[2rem] bg-[#101923] p-7 text-white shadow-[0_24px_70px_rgba(16,25,35,.2)] sm:p-10 lg:p-12">
        <span
          className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[52px] border-primary/15"
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-32 right-28 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#79b4ff]">
            {t.profile.publicMember}
          </p>
          <div className="mt-4 flex items-center gap-4 sm:gap-5">
            {profile.avatar_url ? (
              <Image
                src={postMediaUrl(profile.avatar_url)}
                alt=""
                width={88}
                height={88}
                priority
                className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-white/10 sm:h-22 sm:w-22"
              />
            ) : (
              <DefaultAvatar className="h-20 w-20 ring-4 ring-white/10 sm:h-22 sm:w-22" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">
                  {name}
                </h1>
                {badges.map((badge) => (
                  <BadgePill
                    key={badge.code}
                    code={badge.code}
                    label={locale === "ko" ? badge.name_ko : badge.name_en}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm text-white/50">
                {t.admin.joined}{" "}
                {new Date(profile.created_at).toISOString().slice(0, 10)}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/15 pt-6">
            <p className="max-w-2xl whitespace-pre-wrap text-sm leading-7 text-white/65">
              {publicBio || t.profile.publicMemberHint}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {!isOwn ? (
                <Link
                  href={
                    session.userId
                      ? `/inquiries/new?to=${profile.id}`
                      : `/login?next=/inquiries/new?to=${profile.id}`
                  }
                  className="btn-primary btn-lg"
                >
                  {t.post.inquire}
                </Link>
              ) : (
                <Link href="/dashboard" className="btn-primary btn-lg">
                  {t.common.dashboard}
                </Link>
              )}
              {isOwn && (
                <Link
                  href="/dashboard/profile/edit"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  {t.common.edit}
                </Link>
              )}
              {homepageSlug && (
                <Link
                  href={`/c/${homepageSlug}`}
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  {t.profile.viewCompanyPage}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {(feedItems.length > 0 || isOwn) && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                {t.feed.title}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-.035em]">
                {t.profile.latestUpdates}
              </h2>
            </div>
            <Link
              href="/feed"
              className="text-sm font-bold text-primary hover:text-primary-strong"
            >
              {isOwn ? t.feed.publish : t.dashboard.viewAll} →
            </Link>
          </div>
          {feedItems.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {feedItems.slice(0, 4).map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  viewerId={session.userId}
                  returnTo={`/u/${profile.uid}`}
                  compact
                  labels={getFeedCardLabels(t)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-line bg-white p-6 text-center">
              <p className="text-sm font-bold">{t.feed.empty}</p>
              <Link href="/feed" className="btn-primary btn-md mt-4">
                {t.feed.publish}
              </Link>
            </div>
          )}
        </section>
      )}

      {sections.length > 1 && (
        <nav
          aria-label={t.profile.memberActivity}
          className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4"
        >
          {sections.map(({ menu }) => (
            <a
              key={menu.id}
              href={`#activity-${menu.slug}`}
              className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink-soft shadow-sm transition hover:border-primary/30 hover:text-primary"
            >
              {menu.title_en}
            </a>
          ))}
        </nav>
      )}

      {sections.length > 0 ? (
        <div className="space-y-12">
          {sections.map(({ menu, posts: menuPosts }) => (
            <section
              key={menu.id}
              id={`activity-${menu.slug}`}
              className="scroll-mt-24"
            >
              <div className="mb-5 flex items-end justify-between gap-4">
                <h2 className="text-2xl font-extrabold tracking-[-.035em]">
                  {menu.title_en}
                </h2>
                <Link
                  href={`/${menu.slug}?uid=${profile.uid}`}
                  className="shrink-0 text-sm font-bold text-primary transition hover:text-primary-strong"
                >
                  {t.dashboard.viewAll} →
                </Link>
              </div>

              {menu.board_type === BOARD_TYPES.REQUEST ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-line/80 bg-white shadow-(--shadow-card)">
                  {menuPosts.slice(0, 4).map((post) => {
                    const closed =
                      post.status === POST_STATUS.CLOSED ||
                      (!!post.deadline &&
                        post.deadline < new Date().toISOString().slice(0, 10));
                    return (
                      <Link
                        key={post.id}
                        href={`/${menu.slug}/${post.id}`}
                        className="group grid items-center gap-4 border-b border-line px-5 py-5 transition last:border-b-0 hover:bg-surface-sub sm:grid-cols-[1fr_auto] sm:px-7"
                      >
                        <span className="min-w-0">
                          <strong className="block text-sm font-extrabold leading-snug group-hover:text-primary sm:text-base">
                            {locale === "ko" && post.title_ko
                              ? post.title_ko
                              : post.title_en}
                          </strong>
                          <span className="mt-2 block line-clamp-1 text-xs leading-5 text-ink-soft">
                            {stripRichText(
                              locale === "ko" && post.body_teaser_ko
                                ? post.body_teaser_ko
                                : post.body_teaser_en,
                            )}
                          </span>
                        </span>
                        <span className="flex items-center justify-between gap-3 text-xs font-semibold sm:justify-end">
                          <span
                            className={`rounded-full px-2.5 py-1 ${closed ? "bg-surface-sub text-ink-faint" : "bg-positive-soft text-positive"}`}
                          >
                            {closed ? t.post.closed : t.post.open}
                          </span>
                          <span className="text-ink-faint">
                            {post.deadline
                              ? `${t.post.deadline} ${post.deadline}`
                              : t.post.openEnded}
                          </span>
                          <span className="text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-primary">
                            →
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] sm:gap-4 sm:overflow-visible sm:px-0">
                  {menuPosts.slice(0, 4).map((post, index) => (
                    <div
                      key={post.id}
                      className="w-[76vw] max-w-72 shrink-0 snap-start sm:w-auto sm:max-w-none"
                    >
                      <ProductCard
                        post={post}
                        href={`/${menuSlugById.get(post.menu_id) ?? "industrial"}/${post.id}`}
                        locale={locale}
                        priority={index < 4}
                        showAuthor={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <section>
          <EmptyState
            title={t.common.emptyList}
            hint={t.common.emptyListHint}
          />
        </section>
      )}
    </article>
  );
}
