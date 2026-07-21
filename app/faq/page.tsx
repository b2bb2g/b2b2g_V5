import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { FaqGuide } from "@/components/marketplace/FaqGuide";
import { BoardSectionHeading } from "@/components/marketplace/BoardSectionHeading";
import { FAQ_GUIDE } from "@/lib/data/faq-guide";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.faqGuide.title };
}

// Curated, categorized help center. This static route intentionally overrides
// the dynamic [menuSlug] board for /faq so the FAQ reads like a user manual
// (topic groups + search) instead of a flat post list. It follows the same
// eyebrow/title heading and white-header → grey-content rhythm as the boards.
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
    <div className="full-bleed overflow-hidden bg-[#f5f5f7]">
      <section className="bg-white pb-10 pt-12 sm:pb-12 sm:pt-16 lg:pb-14 lg:pt-20">
        <div className="store-shell">
          <BoardSectionHeading
            eyebrow="FAQ"
            title={t.faqGuide.title}
            body={t.faqGuide.subtitle}
            level="h1"
          />
        </div>
      </section>

      <section className="bg-[#f5f5f7] py-12 sm:py-16 lg:py-20">
        <div className="store-shell">
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

          <div className="mt-10 flex flex-col gap-4 rounded-[1.5rem] bg-[#101923] p-6 text-white shadow-[0_18px_55px_rgba(16,25,35,.16)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
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
      </section>
    </div>
  );
}
