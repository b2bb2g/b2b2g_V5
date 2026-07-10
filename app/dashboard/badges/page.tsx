import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { applyForBadge } from "@/app/actions/badges";
import { BadgeDocsUploader } from "@/components/badges/BadgeDocsUploader";
import type { BadgeType } from "@/lib/types";

export default async function BadgeApplicationPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const userId = session.userId;

  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const [{ data: types }, { data: applications }] = await Promise.all([
    supabase.from("badge_types").select("*").eq("is_active", true).order("sort_order"),
    supabase
      .from("badge_applications")
      .select("id, badge_type_id, status, reject_reason, created_at")
      .eq("profile_id", session.userId)
      .order("created_at", { ascending: false }),
  ]);

  const ownedTypeIds = new Set(session.badges.map((b) => b.badge_type_id));
  const pendingTypeIds = new Set(
    (applications ?? []).filter((a) => a.status === "pending").map((a) => a.badge_type_id)
  );
  const appStatusLabels: Record<string, string> = {
    pending: t.post.status.pending,
    approved: t.post.status.approved,
    rejected: t.post.status.rejected,
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold">{t.dashboard.applyBadge}</h1>

      <div className="space-y-3">
        {((types as BadgeType[]) ?? []).map((type) => {
          const owned = ownedTypeIds.has(type.id);
          const pending = pendingTypeIds.has(type.id);
          const description =
            locale === "ko"
              ? (type as BadgeType & { description_ko?: string }).description_ko
              : (type as BadgeType & { description_en?: string }).description_en;
          return (
            <div key={type.id} className="rounded-card border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">
                  {locale === "ko" ? type.name_ko : type.name_en}
                </p>
                {owned && (
                  <StatusLabel status="approved" label={t.post.status.approved} />
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
              {!owned && !pending && (
                <form action={applyForBadge} className="mt-3 space-y-3">
                  <input type="hidden" name="badgeTypeId" value={type.id} />
                  <textarea
                    name="companyInfo"
                    rows={3}
                    placeholder={t.post.bodyEn}
                    className="field"
                  />
                  <BadgeDocsUploader
                    userId={userId}
                    label={t.badges.attachDocuments}
                    removeLabel={t.common.delete}
                  />
                  <button type="submit" className="btn-primary btn-md">
                    {t.common.submit}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {(applications ?? []).length > 0 && (
        <section className="space-y-2">
          {(applications ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-card border border-line px-4 py-3"
            >
              <p className="text-xs text-ink-faint">
                {new Date(a.created_at).toISOString().slice(0, 10)}
              </p>
              <StatusLabel status={a.status} label={appStatusLabels[a.status] ?? a.status} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
