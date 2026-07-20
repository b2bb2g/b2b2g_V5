import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { FaqGuide } from "@/components/marketplace/FaqGuide";
import { FAQ_GUIDE } from "@/lib/data/faq-guide";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.faqGuide.title };
}

// Curated, categorized help center. This static route intentionally overrides
// the dynamic [menuSlug] board for /faq so the FAQ reads like a user manual
// (topic groups + search) instead of a flat post list.
export default async function FaqPage() {
  const { t, locale } = await getT();
  const categories = FAQ_GUIDE.map((category) => ({
    id: category.id,
    title: locale === "ko" ? category.title_ko : category.title_en,
    items: category.items.map((item) => ({
      q: locale === "ko" ? item.q_ko : item.q_en,
      a: locale === "ko" ? item.a_ko : item.a_en,
    })),
  }));

  return (
    <div className="full-bleed bg-[#f5f5f7]">
      <div className="store-shell py-12 sm:py-16 lg:py-20">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-[-.03em] text-ink sm:text-4xl">
            {t.faqGuide.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-ink-soft">
            {t.faqGuide.subtitle}
          </p>
        </header>

        <div className="mt-10">
          <FaqGuide
            categories={categories}
            labels={{
              search: t.faqGuide.search,
              clear: t.faqGuide.clear,
              empty: t.faqGuide.empty,
              count: t.faqGuide.count,
              onThisPage: t.faqGuide.onThisPage,
            }}
          />
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-[1.5rem] bg-[#101923] p-6 text-white shadow-[0_18px_55px_rgba(16,25,35,.16)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold tracking-[-.02em]">
              {t.faqGuide.helpTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-white/70">
              {t.faqGuide.helpBody}
            </p>
          </div>
          <Link
            href="/notices"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-[#101923] transition hover:bg-white/88"
          >
            {t.faqGuide.helpCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
