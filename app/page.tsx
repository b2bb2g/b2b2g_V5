import Link from "next/link";
import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import { postMediaUrl } from "@/lib/media";
import { SETTING_KEYS } from "@/lib/constants";

// Featured exposure for paid members (PRD 5.3): published mini homepages,
// slot count controlled by the admin featured_slots setting.
async function getFeaturedCompanies(limit: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mini_homepages")
    .select("slug, cover_image_path, intro_en, intro_ko, profiles(display_name, company_name)")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as {
    slug: string;
    cover_image_path: string | null;
    intro_en: string;
    intro_ko: string | null;
    profiles: { display_name: string | null; company_name: string | null } | null;
  }[];
}

function ValueIcon({ kind }: { kind: "review" | "relay" | "badge" }) {
  const paths = {
    review: (
      <>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    relay: (
      <>
        <path d="m3 3 3 9-3 9 19-9Z" />
        <path d="M6 12h16" />
      </>
    ),
    badge: (
      <>
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {paths[kind]}
      </svg>
    </span>
  );
}

export default async function Home() {
  const [{ t, locale }, menus, session, settings] = await Promise.all([
    getT(),
    getVisibleMenus(),
    getSession(),
    getPublicSettings(),
  ]);
  const featured = await getFeaturedCompanies(
    settingNumber(settings, SETTING_KEYS.FEATURED_SLOTS, 6)
  );

  const values = [
    { kind: "review" as const, title: t.home.value1Title, body: t.home.value1Body },
    { kind: "relay" as const, title: t.home.value2Title, body: t.home.value2Body },
    { kind: "badge" as const, title: t.home.value3Title, body: t.home.value3Body },
  ];
  const steps = [
    { title: t.home.step1Title, body: t.home.step1Body },
    { title: t.home.step2Title, body: t.home.step2Body },
    { title: t.home.step3Title, body: t.home.step3Body },
  ];
  const boardTypeLabels: Record<string, string> = t.admin.boardTypes;
  const firstBoard = menus[0]?.slug ?? "industrial";

  return (
    <div className="space-y-12 pb-4">
      {/* Hero: one key message, two clear actions (DESIGN 2.0) */}
      <section className="pt-6 text-center sm:pt-10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          {t.home.eyebrow}
        </p>
        <h1 className="mx-auto mt-3 max-w-xl text-[1.75rem] font-extrabold leading-[1.25] tracking-tight sm:text-4xl sm:leading-[1.2]">
          {t.home.heroTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
          {t.home.heroSubtitle}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          {session.userId ? (
            <>
              <Link href="/write/select" className="btn-primary btn-lg">
                {t.dashboard.registerProduct}
              </Link>
              <Link href={`/${firstBoard}`} className="btn-secondary btn-lg">
                {t.home.browseBoards}
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="btn-primary btn-lg">
                {t.home.startNow}
              </Link>
              <Link href={`/${firstBoard}`} className="btn-secondary btn-lg">
                {t.home.browseBoards}
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Value propositions */}
      <section>
        <h2 className="section-title">{t.home.valueTitle}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {values.map((value) => (
            <div key={value.kind} className="card p-5">
              <ValueIcon kind={value.kind} />
              <p className="mt-3 text-sm font-bold">{value.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {value.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Boards */}
      <section>
        <h2 className="section-title">{t.home.boardsTitle}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {menus.map((menu) => (
            <Link key={menu.id} href={`/${menu.slug}`} className="card-hover group p-4">
              <p className="font-bold text-ink">
                {locale === "ko" ? menu.title_ko : menu.title_en}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                {boardTypeLabels[menu.board_type] ?? menu.board_type}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured companies (paid benefit, PRD 5.3) */}
      {featured.length > 0 && (
        <section>
          <h2 className="section-title">{t.home.featured}</h2>
          <div className="scrollbar-none -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4">
            {featured.map((company) => {
              const name =
                company.profiles?.company_name ??
                company.profiles?.display_name ??
                company.slug;
              const intro =
                locale === "ko" && company.intro_ko
                  ? company.intro_ko
                  : company.intro_en;
              return (
                <Link
                  key={company.slug}
                  href={`/c/${company.slug}`}
                  className="card-hover w-56 shrink-0 snap-start overflow-hidden"
                >
                  <div className="relative aspect-video bg-surface-sub">
                    {company.cover_image_path && (
                      <Image
                        src={postMediaUrl(company.cover_image_path)}
                        alt={name}
                        fill
                        sizes="224px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold">{name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                      {intro}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* How it works */}
      <section>
        <h2 className="section-title">{t.home.howItWorksTitle}</h2>
        <ol className="mt-4 space-y-0">
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
              {i < steps.length - 1 && (
                <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-line" aria-hidden="true" />
              )}
              <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-extrabold text-primary-strong">
                {i + 1}
              </span>
              <div className="pt-1">
                <p className="text-sm font-bold">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      {!session.userId && (
        <section className="rounded-card bg-ink px-6 py-10 text-center">
          <h2 className="text-xl font-extrabold text-white">
            {t.home.finalCtaTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            {t.home.finalCtaBody}
          </p>
          <Link
            href="/signup"
            className="btn btn-lg mt-6 bg-white text-ink hover:bg-white/90"
          >
            {t.common.signUp}
          </Link>
        </section>
      )}
    </div>
  );
}
