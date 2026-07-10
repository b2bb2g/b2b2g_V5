import Link from "next/link";
import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import { postMediaUrl } from "@/lib/media";
import { Reveal } from "@/components/ui/Reveal";
import { Carousel } from "@/components/ui/Carousel";
import { BadgePill } from "@/components/ui/Badge";
import { StatusLabel } from "@/components/ui/StatusLabel";
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

// Hero visual: a composition of the platform's real UI vocabulary
// (product card, review status, badges) instead of stock imagery.
function HeroVisual({ t }: { t: Awaited<ReturnType<typeof getT>>["t"] }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="card overflow-hidden shadow-(--shadow-float)">
        <div className="flex aspect-[4/3] items-center justify-center bg-primary-soft">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" aria-hidden="true">
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M17 18h1" />
            <path d="M12 18h1" />
            <path d="M7 18h1" />
          </svg>
        </div>
        <div className="space-y-2 p-4">
          <p className="text-sm font-bold">{t.home.mockProduct}</p>
          <p className="text-xs text-ink-faint">{t.home.mockCompany}</p>
          <div className="flex gap-1.5 pt-1">
            <BadgePill code="manufacturer" label={t.badges.manufacturer} />
            <BadgePill code="certified" label={t.badges.certified} />
          </div>
          <div className="btn-primary btn-md pointer-events-none mt-2 w-full">
            {t.post.inquire}
          </div>
        </div>
      </div>

      {/* Floating status chips: the mediation cycle at a glance */}
      <div className="animate-float absolute -left-4 top-10 hidden sm:block" style={{ animationDelay: "0.6s" }}>
        <div className="card flex items-center gap-2 px-3 py-2 shadow-(--shadow-float)">
          <StatusLabel status="admin_review" label={t.inquiry.steps.admin_review} />
        </div>
      </div>
      <div className="animate-float absolute -right-5 bottom-24 hidden sm:block">
        <div className="card flex items-center gap-2 px-3 py-2 shadow-(--shadow-float)">
          <StatusLabel
            status="answer_delivered"
            label={t.inquiry.steps.answer_delivered}
          />
        </div>
      </div>
    </div>
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
  const stats = [t.home.stat1, t.home.stat2, t.home.stat3];
  const boardTypeLabels: Record<string, string> = t.admin.boardTypes;
  const firstBoard = menus[0]?.slug ?? "industrial";
  const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

  return (
    <div className="full-bleed">
      {/* ============ Hero: full-viewport split layout ============ */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-primary-soft/60 via-surface to-surface">
        <div className={`${container} grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-24`}>
          <div className="animate-fade-up text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t.home.eyebrow}
            </p>
            <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.2] tracking-tight sm:text-5xl sm:leading-[1.15]">
              {t.home.heroTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base lg:mx-0">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row lg:justify-start">
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
            <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 lg:justify-start">
              {stats.map((stat) => (
                <li key={stat} className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-positive" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {stat}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <HeroVisual t={t} />
          </div>
        </div>
      </section>

      {/* ============ Value propositions ============ */}
      <section className={`${container} py-16 sm:py-24`}>
        <Reveal>
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t.home.valueTitle}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.kind} delay={i * 90}>
              <div className="card-hover h-full p-6">
                <ValueIcon kind={value.kind} />
                <p className="mt-4 text-base font-bold">{value.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {value.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ Boards ============ */}
      <section className="border-y border-line bg-surface-sub/50">
        <div className={`${container} py-16 sm:py-24`}>
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t.home.boardsTitle}
            </h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {menus.map((menu, i) => (
              <Reveal key={menu.id} delay={(i % 4) * 70}>
                <Link href={`/${menu.slug}`} className="card-hover group block p-5">
                  <p className="text-base font-bold text-ink">
                    {locale === "ko" ? menu.title_ko : menu.title_en}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                    {boardTypeLabels[menu.board_type] ?? menu.board_type}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Featured companies carousel ============ */}
      {featured.length > 0 && (
        <section className={`${container} py-16 sm:py-24`}>
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t.home.featured}
            </h2>
          </Reveal>
          <div className="mt-8">
            <Carousel prevLabel={t.home.prev} nextLabel={t.home.next}>
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
                    className="card-hover w-64 shrink-0 snap-start overflow-hidden sm:w-72"
                  >
                    <div className="relative aspect-video bg-surface-sub">
                      {company.cover_image_path && (
                        <Image
                          src={postMediaUrl(company.cover_image_path)}
                          alt={name}
                          fill
                          sizes="288px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="truncate text-sm font-bold">{name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                        {intro}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </Carousel>
          </div>
        </section>
      )}

      {/* ============ How it works ============ */}
      <section className={`${container} py-16 sm:py-24`}>
        <Reveal>
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t.home.howItWorksTitle}
          </h2>
        </Reveal>
        <div className="relative mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
          <span className="absolute left-1/2 top-5 hidden h-px w-2/3 -translate-x-1/2 bg-line sm:block" aria-hidden="true" />
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 110}>
              <div className="relative text-center">
                <span className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white shadow-(--shadow-card)">
                  {i + 1}
                </span>
                <p className="mt-4 text-base font-bold">{step.title}</p>
                <p className="mx-auto mt-1.5 max-w-60 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      {!session.userId && (
        <section className="border-t border-line bg-ink">
          <div className={`${container} py-16 text-center sm:py-20`}>
            <Reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t.home.finalCtaTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
                {t.home.finalCtaBody}
              </p>
              <Link
                href="/signup"
                className="btn btn-lg mt-8 bg-white text-ink hover:bg-white/90"
              >
                {t.common.signUp}
              </Link>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}
