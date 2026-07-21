import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { requireAdmin } from "@/app/actions/admin/core";
import { getPublicSettings, settingString, settingNumber } from "@/lib/data/settings";
import { updateSetting } from "@/app/actions/admin";
import { updateLandingContent, uploadSiteAsset } from "@/app/actions/admin/operations";
import { LANDING_SECTIONS, LANDING_HERO_IMAGE_KEY } from "@/lib/data/landing-content";
import { SETTING_KEYS } from "@/lib/constants";
import { ClearableInput } from "@/components/ui/TextField";
import { PendingButton } from "@/components/ui/PendingButton";

// Landing-page editor: every section's copy (bilingual) plus the hero
// background image, grouped by section so an admin can find and edit it. Each
// field overrides its i18n default; a blank value falls back to the default.
export default async function AdminLandingPage(props: {
  searchParams: Promise<{ toast?: string; error?: string }>;
}) {
  const [{ t }, , { toast, error }] = await Promise.all([
    getT(),
    requireAdmin("content"),
    props.searchParams,
  ]);
  const settings = await getPublicSettings();
  const homeKo = getDictionary("ko").home as Record<string, string>;
  const homeEn = getDictionary("en").home as Record<string, string>;
  const heroImage = settingString(settings, LANDING_HERO_IMAGE_KEY);
  const val = (key: string, lang: "ko" | "en") =>
    settingString(settings, `landing_${key}_${lang}`) ||
    (lang === "ko" ? homeKo : homeEn)[key] ||
    "";
  const L = t.admin.landing;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold">{L.title}</h2>
        <p className="mt-1 text-xs text-ink-faint">{L.blankHint}</p>
      </div>

      {toast === "saved" && (
        <p role="status" className="rounded-xl bg-positive-soft px-4 py-2.5 text-sm font-bold text-positive">
          {L.saved}
        </p>
      )}
      {error === "invalid_asset" && (
        <p role="alert" className="rounded-xl bg-negative-soft px-4 py-2.5 text-sm font-bold text-negative">
          {L.imageError}
        </p>
      )}

      {/* Hero background image + featured-slots knob (relocated from settings). */}
      <section className="rounded-[1.25rem] border border-line bg-white p-4 shadow-(--shadow-card) sm:p-5">
        <h3 className="text-sm font-extrabold">{L.heroImage}</h3>
        <p className="mt-1 text-xs text-ink-faint">{L.heroImageHint}</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative h-28 w-full max-w-xs overflow-hidden rounded-xl border border-line bg-surface-sub sm:w-56">
            {heroImage ? (
              <Image src={heroImage} alt={L.heroImage} fill className="object-cover" sizes="224px" />
            ) : (
              <span className="flex h-full items-center justify-center text-xs text-ink-faint">
                {L.noImage}
              </span>
            )}
          </div>
          <form action={uploadSiteAsset} className="flex flex-col gap-2">
            <input type="hidden" name="key" value={LANDING_HERO_IMAGE_KEY} />
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required
              aria-label={L.heroImage}
              className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-surface-sub file:px-3 file:py-2 file:text-xs file:font-semibold"
            />
            <PendingButton className="btn-secondary btn-sm w-fit">{L.uploadImage}</PendingButton>
          </form>
        </div>
        <form action={updateSetting} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <input type="hidden" name="key" value={SETTING_KEYS.FEATURED_SLOTS} />
          <input type="hidden" name="kind" value="number" />
          <label className="text-xs font-semibold text-ink-soft">
            {L.featuredSlots}
            <input
              name="value"
              type="number"
              min={0}
              max={24}
              defaultValue={settingNumber(settings, SETTING_KEYS.FEATURED_SLOTS, 6)}
              aria-label={L.featuredSlots}
              className="field ml-2 w-20 px-2 py-1.5 text-xs"
            />
          </label>
          <PendingButton className="btn-secondary btn-sm">{t.common.save}</PendingButton>
        </form>
      </section>

      {/* One card per landing section: bilingual field pairs + a Save. */}
      {LANDING_SECTIONS.map((section) => (
        <section
          key={section.id}
          className="rounded-[1.25rem] border border-line bg-white p-4 shadow-(--shadow-card) sm:p-5"
        >
          <form action={updateLandingContent} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold">{L.sections[section.id]}</h3>
              <PendingButton className="btn-primary btn-sm">{t.common.save}</PendingButton>
            </div>
            <div className="space-y-3">
              {section.fields.map((field) => {
                const roleLabel = L.roles[field.role];
                return (
                  <div key={field.key} className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <p className="text-xs font-semibold text-ink-soft">{roleLabel}</p>
                      <span className="font-mono text-[10px] text-ink-faint">{field.key}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <ClearableInput
                        name={`landing_${field.key}_ko`}
                        defaultValue={val(field.key, "ko")}
                        aria-label={`${roleLabel} ${field.key} ${L.langKo}`}
                        clearLabel={t.common.clearInput}
                        className="text-xs"
                      />
                      <ClearableInput
                        name={`landing_${field.key}_en`}
                        defaultValue={val(field.key, "en")}
                        aria-label={`${roleLabel} ${field.key} ${L.langEn}`}
                        clearLabel={t.common.clearInput}
                        className="text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        </section>
      ))}
    </div>
  );
}
