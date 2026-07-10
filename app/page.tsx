import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";

export default async function Home() {
  const [{ t, locale }, menus, session] = await Promise.all([
    getT(),
    getVisibleMenus(),
    getSession(),
  ]);

  const steps = [
    { title: t.home.step1Title, body: t.home.step1Body },
    { title: t.home.step2Title, body: t.home.step2Body },
    { title: t.home.step3Title, body: t.home.step3Body },
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-card bg-primary-soft px-6 py-10">
        <h1 className="text-2xl font-extrabold leading-snug text-ink">
          {t.home.heroTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {t.home.heroSubtitle}
        </p>
        {!session.userId && (
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-strong"
          >
            {t.common.signUp}
          </Link>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">{t.home.browseBoards}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {menus.map((menu) => (
            <Link
              key={menu.id}
              href={`/${menu.slug}`}
              className="rounded-card border border-line bg-surface p-4 transition-colors hover:border-primary hover:bg-primary-soft/40"
            >
              <p className="font-bold text-ink">
                {locale === "ko" ? menu.title_ko : menu.title_en}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">{t.home.howItWorksTitle}</h2>
        <ol className="mt-3 space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-card border border-line p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-extrabold text-primary-strong">
                {i + 1}
              </span>
              <div>
                <p className="font-bold">{step.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
