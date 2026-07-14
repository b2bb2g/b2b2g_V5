import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { applyForBadge } from "@/app/actions/badges";
import { BadgeDocsUploader } from "@/components/badges/BadgeDocsUploader";
import { BADGE_CODES, SUBSCRIPTION_STATUS } from "@/lib/constants";
import type { BadgeType } from "@/lib/types";
import { PendingButton } from "@/components/ui/PendingButton";
import { formatDate } from "@/lib/format";

export default async function BadgeApplicationPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const userId = session.userId;

  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const [{ data: types }, { data: applications }, { data: subs }] =
    await Promise.all([
      supabase
        .from("badge_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("badge_applications")
        .select("id, badge_type_id, status, reject_reason, created_at")
        .eq("profile_id", session.userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("id")
        .eq("profile_id", session.userId)
        .eq("status", SUBSCRIPTION_STATUS.ACTIVE)
        .gt("expires_at", new Date().toISOString())
        .limit(1),
    ]);

  const hasActiveSubscription = (subs?.length ?? 0) > 0;
  const ownedTypeIds = new Set(session.badges.map((b) => b.badge_type_id));
  const pendingTypeIds = new Set(
    (applications ?? [])
      .filter((a) => a.status === "pending")
      .map((a) => a.badge_type_id),
  );
  const typeNameById = new Map(
    ((types as BadgeType[]) ?? []).map((type) => [
      type.id,
      locale === "ko" ? type.name_ko : type.name_en,
    ]),
  );
  const appStatusLabels: Record<string, string> = {
    pending: t.post.status.pending,
    approved: t.post.status.approved,
    rejected: t.post.status.rejected,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.dashboard.applyBadge}
        description={t.dashboard.applyBadgeHint}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {((types as BadgeType[]) ?? []).map((type) => {
          const owned = ownedTypeIds.has(type.id);
          const pending = pendingTypeIds.has(type.id);
          const isCertified = type.code === BADGE_CODES.CERTIFIED;
          const isManufacturer = type.code === BADGE_CODES.MANUFACTURER;
          const description =
            locale === "ko"
              ? (type as BadgeType & { description_ko?: string }).description_ko
              : (type as BadgeType & { description_en?: string })
                  .description_en;
          // Differentiated flows (C4): manufacturer = free role badge with
          // company documents; certified = subscription + identity check.
          const hint = isManufacturer
            ? t.badges.manufacturerHint
            : isCertified
              ? t.badges.certifiedHint
              : null;
          return (
            <div
              key={type.id}
              className="flex flex-col rounded-[1.5rem] border border-line/70 bg-white p-5 shadow-(--shadow-card) sm:p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-extrabold">
                  {locale === "ko" ? type.name_ko : type.name_en}
                </p>
                {owned && (
                  <StatusLabel
                    status="approved"
                    label={t.post.status.approved}
                  />
                )}
                {pending && (
                  <StatusLabel status="pending" label={t.post.status.pending} />
                )}
              </div>
              {description && (
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {description}
                </p>
              )}
              {hint && (
                <p className="mt-1 text-xs leading-relaxed text-ink-faint">
                  {hint}
                </p>
              )}
              {!owned && !pending && isCertified && !hasActiveSubscription && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary-soft/60 px-3 py-2.5">
                  <p className="text-xs font-semibold text-primary-strong">
                    {t.badges.certifiedNeedsSubscription}
                  </p>
                  <Link
                    href="/membership"
                    className="text-xs font-bold text-primary-strong underline underline-offset-2"
                  >
                    {t.badges.membershipGuideLink}
                  </Link>
                </div>
              )}
              {!owned && !pending && (
                <form action={applyForBadge} className="mt-3 space-y-3">
                  <input type="hidden" name="badgeTypeId" value={type.id} />
                  <textarea
                    name="companyInfo"
                    rows={3}
                    placeholder={t.badges.companyInfoPlaceholder}
                    className="field"
                  />
                  <BadgeDocsUploader
                    userId={userId}
                    label={
                      isCertified
                        ? t.badges.attachIdentityDocs
                        : t.badges.attachDocuments
                    }
                    removeLabel={t.common.delete}
                  />
                  <PendingButton className="btn-primary btn-md">
                    {t.common.submit}
                  </PendingButton>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {(applications ?? []).length > 0 && (
        <section className="overflow-hidden rounded-[1.5rem] border border-line/70 bg-white shadow-(--shadow-card)">
          <h2 className="border-b border-line px-5 py-4 text-sm font-extrabold sm:px-6">
            {t.badges.applicationHistory}
          </h2>
          <div className="divide-y divide-line">
            {(applications ?? []).map((a) => (
              <div key={a.id} className="px-5 py-3.5 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 text-sm font-semibold">
                    <span className="truncate">
                      {typeNameById.get(a.badge_type_id) ?? ""}
                    </span>
                    <span className="ml-2 text-xs font-normal text-ink-faint">
                      {formatDate(a.created_at, locale)}
                    </span>
                  </p>
                  <StatusLabel
                    status={a.status}
                    label={appStatusLabels[a.status] ?? a.status}
                  />
                </div>
                {a.status === "rejected" && a.reject_reason && (
                  <p className="mt-1 text-xs text-ink-soft">
                    {t.badges.rejectedReason}: {a.reject_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
