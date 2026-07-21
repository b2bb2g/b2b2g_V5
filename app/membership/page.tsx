import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicSettings,
  settingNumber,
  settingString,
} from "@/lib/data/settings";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { SETTING_KEYS, SUBSCRIPTION_STATUS } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t.membership.title,
    description: t.membership.subtitle,
    alternates: { canonical: "/membership" },
  };
}


// Module-scope time helpers: keeps impure Date calls out of component render
// (react-hooks purity rule), mirroring isoDaysFromNow elsewhere.
function isActiveSubscription(status: string, expiresAt: string): boolean {
  return (
    status === SUBSCRIPTION_STATUS.ACTIVE &&
    new Date(expiresAt).getTime() > Date.now()
  );
}
function isExpiringSoon(expiresAt: string, noticeDays: number): boolean {
  return (
    new Date(expiresAt).getTime() - Date.now() < noticeDays * 24 * 60 * 60 * 1000
  );
}

// Subscription guide (DESIGN C5): benefits, manual bank-transfer process
// (PRD 4 -- payments are confirmed by the operations team, no PG yet).
export default async function MembershipPage() {
  const [{ t, locale }, session, settings] = await Promise.all([
    getT(),
    getSession(),
    getPublicSettings(),
  ]);

  // Benefit catalog is admin-managed data (PRD 5.4), not code.
  const supabaseAnon = await createClient();
  const { data: benefitRows } = await supabaseAnon
    .from("benefits")
    .select("title_en, title_ko, body_en, body_ko")
    .eq("is_active", true)
    .order("sort_order");
  const benefits = (benefitRows ?? []).map((b) => ({
    title: locale === "ko" && b.title_ko ? b.title_ko : b.title_en,
    body: locale === "ko" && b.body_ko ? b.body_ko : b.body_en,
  }));
  const steps = [t.membership.how1, t.membership.how2, t.membership.how3];
  const priceNote = settingString(settings, "membership_price_note");
  const bankNote = settingString(settings, "membership_bank_note");
  const applyHref = session.userId ? "/dashboard/badges" : "/signup";

  // Signed-in members see their own subscription state up front (C5:
  // active / expiring soon / expired variants).
  let subscription: { expires_at: string; expiring: boolean } | null = null;
  let hadSubscription = false;
  if (session.userId) {
    const { data: rows } = await supabaseAnon
      .from("subscriptions")
      .select("status, expires_at")
      .eq("profile_id", session.userId)
      .order("expires_at", { ascending: false })
      .limit(1);
    const latest = rows?.[0];
    if (latest) {
      hadSubscription = true;
      if (isActiveSubscription(latest.status, latest.expires_at)) {
        const noticeDays = settingNumber(
          settings,
          SETTING_KEYS.SUBSCRIPTION_EXPIRY_NOTICE_DAYS,
          14
        );
        subscription = {
          expires_at: latest.expires_at,
          expiring: isExpiringSoon(latest.expires_at, noticeDays),
        };
      }
    }
  }

  return (
    <div className="wide space-y-14 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16">
        <span className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/35 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">B2BB2G Certified</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] sm:text-5xl">
          {t.membership.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
          {t.membership.subtitle}
        </p>
        {!subscription && (
          <Link href={applyHref} className="btn-primary btn-lg mt-6">
            {t.membership.apply}
          </Link>
        )}
        </div>
      </section>

      {session.userId && (subscription || hadSubscription) && (
        <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-bold">{t.membership.statusTitle}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {subscription
                ? `${t.membership.statusUntil} ${subscription.expires_at.slice(0, 10)}`
                : t.membership.statusExpiredBody}
            </p>
          </div>
          {subscription ? (
            <StatusLabel
              status={subscription.expiring ? "pending" : "approved"}
              label={
                subscription.expiring
                  ? t.membership.statusExpiring
                  : t.membership.statusActive
              }
            />
          ) : (
            <StatusLabel status="closed" label={t.membership.statusExpired} />
          )}
        </section>
      )}

      <section>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight">{t.membership.compareTitle}</h2>
          <p className="mt-2 text-sm text-ink-soft">{t.membership.included}</p>
        </div>
        <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8">
            <p className="text-xl font-extrabold">{t.membership.freePlan}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.membership.freeDescription}</p>
            <div className="my-6 h-px bg-line" />
            <ul className="space-y-3 text-sm text-ink-soft">
              {[t.membership.freeFeature1, t.membership.freeFeature2].map((feature) => <li key={feature} className="flex gap-2"><span aria-hidden="true" className="text-positive">✓</span>{feature}</li>)}
            </ul>
          </article>
          <article className="relative rounded-[1.5rem] border-2 border-primary bg-primary-soft/35 p-6 shadow-[0_24px_60px_rgba(49,130,246,0.13)] sm:p-8">
            <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">{t.membership.recommended}</span>
            <p className="text-xl font-extrabold">{t.membership.certifiedPlan}</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{t.membership.certifiedDescription}</p>
            <div className="my-6 h-px bg-primary/15" />
            <ul className="space-y-3 text-sm font-semibold text-ink-soft">
              {benefits.map((benefit) => <li key={benefit.title} className="flex gap-2"><span aria-hidden="true" className="text-primary">✓</span>{benefit.title}</li>)}
            </ul>
            <Link href={applyHref} className="btn-primary btn-lg mt-7 w-full">{t.membership.apply}</Link>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 rounded-[1.5rem] bg-surface-sub p-6 sm:p-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <h2 className="text-xl font-extrabold">{t.membership.priceTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{priceNote}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">{bankNote}</p>
        </div>
        <div>
        <h2 className="text-xl font-extrabold">{t.membership.howTitle}</h2>
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
        </div>
      </section>

      <div className="text-center">
        <Link href={applyHref} className="btn-primary btn-lg">
          {t.membership.apply}
        </Link>
      </div>
    </div>
  );
}
