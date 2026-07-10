import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getPublicSettings, settingString } from "@/lib/data/settings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.membership.title, description: t.membership.subtitle };
}

// Subscription guide (DESIGN C5): benefits, manual bank-transfer process
// (PRD 4 -- payments are confirmed by the operations team, no PG yet).
export default async function MembershipPage() {
  const [{ t }, session, settings] = await Promise.all([
    getT(),
    getSession(),
    getPublicSettings(),
  ]);

  const benefits = [
    { title: t.membership.benefit1Title, body: t.membership.benefit1Body },
    { title: t.membership.benefit2Title, body: t.membership.benefit2Body },
    { title: t.membership.benefit3Title, body: t.membership.benefit3Body },
    { title: t.membership.benefit4Title, body: t.membership.benefit4Body },
  ];
  const steps = [t.membership.how1, t.membership.how2, t.membership.how3];
  const priceNote = settingString(settings, "membership_price_note");
  const bankNote = settingString(settings, "membership_bank_note");
  const applyHref = session.userId ? "/dashboard/badges" : "/signup";

  return (
    <div className="space-y-10 pb-4">
      <section className="pt-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t.membership.title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          {t.membership.subtitle}
        </p>
        <Link href={applyHref} className="btn-primary btn-lg mt-6">
          {t.membership.apply}
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {benefits.map((benefit, i) => (
          <div key={benefit.title} className="card p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-extrabold text-primary-strong">
              {i + 1}
            </span>
            <p className="mt-3 text-sm font-bold">{benefit.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              {benefit.body}
            </p>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <h2 className="text-base font-bold">{t.membership.priceTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{priceNote}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-faint">{bankNote}</p>
      </section>

      <section>
        <h2 className="text-base font-bold">{t.membership.howTitle}</h2>
        <ol className="mt-3 space-y-0">
          {steps.map((step, i) => (
            <li key={step} className="relative flex gap-4 pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-line" aria-hidden="true" />
              )}
              <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-extrabold text-primary-strong">
                {i + 1}
              </span>
              <p className="pt-1.5 text-sm leading-relaxed text-ink-soft">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="text-center">
        <Link href={applyHref} className="btn-primary btn-lg">
          {t.membership.apply}
        </Link>
      </div>
    </div>
  );
}
