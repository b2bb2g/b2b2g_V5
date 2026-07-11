import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { grantSubscription, revokeSubscription, saveBenefit, toggleBenefitActive } from "@/app/actions/admin";
import { SUBSCRIPTION_STATUS } from "@/lib/constants";

export default async function SubscriptionsAdminPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: benefitRows } = await supabase
    .from("benefits")
    .select("*")
    .order("sort_order");
  const benefits = (benefitRows ?? []) as {
    id: string;
    title_en: string;
    title_ko: string | null;
    body_en: string;
    body_ko: string | null;
    is_active: boolean;
  }[];
  const { data } = await supabase
    .from("subscriptions")
    .select("id, status, starts_at, expires_at, deposit_note, profiles!subscriptions_profile_id_fkey(uid, display_name, company_name)")
    .eq("status", SUBSCRIPTION_STATUS.ACTIVE)
    .order("expires_at");

  const subscriptions = (data ?? []) as unknown as {
    id: string;
    status: string;
    starts_at: string;
    expires_at: string;
    deposit_note: string | null;
    profiles: { uid: number; display_name: string | null; company_name: string | null } | null;
  }[];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold">{t.admin.subscriptions}</h2>

      {/* Manual grant after wire-transfer confirmation (PRD 4) */}
      <form
        action={grantSubscription}
        className="space-y-2 rounded-card border border-line p-4"
      >
        <p className="text-sm font-bold">{t.admin.grantSubscription}</p>
        <div className="grid grid-cols-3 gap-2">
          <input
            name="uid"
            required
            type="number"
            placeholder={t.admin.uid}
            className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <input
            name="days"
            required
            type="number"
            placeholder={t.admin.grantDays}
            className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <input
            name="note"
            placeholder={t.admin.feedback}
            className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-strong"
        >
          {t.admin.grantSubscription}
        </button>
      </form>

      {subscriptions.length === 0 ? (
        <EmptyState title={t.common.emptyList} />
      ) : (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between gap-3 rounded-card border border-line px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {sub.profiles?.company_name ?? sub.profiles?.display_name}
                  <span className="ml-2 text-xs font-normal text-ink-faint">
                    UID {sub.profiles?.uid}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {new Date(sub.starts_at).toISOString().slice(0, 10)}
                  {" ~ "}
                  {new Date(sub.expires_at).toISOString().slice(0, 10)}
                  {sub.deposit_note && ` · ${sub.deposit_note}`}
                </p>
              </div>
              <form action={revokeSubscription}>
                <input type="hidden" name="subscriptionId" value={sub.id} />
                <ConfirmSubmit
                  label={t.admin.revoke}
                  confirmTitle={t.common.confirmTitle}
                  confirmBody={t.common.doubleConfirm}
                  confirmLabel={t.admin.revoke}
                  cancelLabel={t.common.cancel}
                  className="rounded-lg bg-negative-soft px-3 py-1.5 text-xs font-semibold text-negative"
                  destructive
                />
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic benefit catalog (PRD 5.4): edited here, rendered on /membership */}
      <section className="space-y-2 rounded-card border border-line p-4">
        <p className="text-sm font-bold">{t.admin.benefitsTitle}</p>
        <div className="space-y-2">
          {benefits.map((benefit) => (
            <details key={benefit.id} className="rounded-xl border border-line px-3 py-2">
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs font-semibold">
                <span className={benefit.is_active ? "" : "text-ink-faint line-through"}>
                  {benefit.title_en}
                </span>
                <form action={toggleBenefitActive}>
                  <input type="hidden" name="id" value={benefit.id} />
                  <input type="hidden" name="value" value={(!benefit.is_active).toString()} />
                  <button
                    type="submit"
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                      benefit.is_active
                        ? "bg-positive-soft text-positive"
                        : "bg-surface-sub text-ink-faint"
                    }`}
                  >
                    {benefit.is_active ? t.common.on : t.common.off}
                  </button>
                </form>
              </summary>
              <form action={saveBenefit} className="mt-2 grid grid-cols-2 gap-2">
                <input type="hidden" name="id" value={benefit.id} />
                <input name="titleEn" required defaultValue={benefit.title_en} className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary" />
                <input name="titleKo" defaultValue={benefit.title_ko ?? ""} className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary" />
                <input name="bodyEn" defaultValue={benefit.body_en} className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary" />
                <input name="bodyKo" defaultValue={benefit.body_ko ?? ""} className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary" />
                <button type="submit" className="col-span-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-strong">
                  {t.common.save}
                </button>
              </form>
            </details>
          ))}
        </div>
        <details className="rounded-xl border border-dashed border-line px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-primary">
            {t.admin.addBenefit}
          </summary>
          <form action={saveBenefit} className="mt-2 grid grid-cols-2 gap-2">
            <input name="titleEn" required placeholder={t.post.titleEn} className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary" />
            <input name="titleKo" placeholder={t.post.titleKo} className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary" />
            <input name="bodyEn" placeholder={t.post.bodyEn} className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary" />
            <input name="bodyKo" placeholder={t.post.bodyKo} className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary" />
            <button type="submit" className="col-span-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-strong">
              {t.common.save}
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
