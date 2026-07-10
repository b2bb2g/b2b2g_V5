import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewBadgeApplication } from "@/app/actions/admin";

export default async function BadgeAdminPage() {
  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const { data } = await supabase
    .from("badge_applications")
    .select("*, badge_types(name_en, name_ko), profiles(uid, display_name, company_name)")
    .eq("status", "pending")
    .order("created_at");

  const applications = (data ?? []) as unknown as {
    id: string;
    company_info: { note?: string };
    created_at: string;
    badge_types: { name_en: string; name_ko: string } | null;
    profiles: { uid: number; display_name: string | null; company_name: string | null } | null;
  }[];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold">{t.admin.badgeAdmin}</h2>
      {applications.length === 0 ? (
        <EmptyState title={t.admin.noPending} />
      ) : (
        applications.map((app) => (
          <div key={app.id} className="rounded-card border border-line p-4">
            <p className="text-sm font-bold">
              {app.badge_types
                ? locale === "ko"
                  ? app.badge_types.name_ko
                  : app.badge_types.name_en
                : ""}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {app.profiles?.company_name ?? app.profiles?.display_name}
              {" · UID "}
              {app.profiles?.uid}
              {" · "}
              {new Date(app.created_at).toISOString().slice(0, 10)}
            </p>
            {app.company_info?.note && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-surface-sub/60 px-3 py-2 text-xs text-ink-soft">
                {app.company_info.note}
              </p>
            )}
            <form action={reviewBadgeApplication} className="mt-3 space-y-2">
              <input type="hidden" name="applicationId" value={app.id} />
              <input
                name="reason"
                placeholder={t.admin.rejectReason}
                className="w-full rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  name="decision"
                  value="approve"
                  className="flex-1 rounded-xl bg-positive px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.approve}
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="reject"
                  className="flex-1 rounded-xl bg-negative px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.reject}
                </button>
              </div>
            </form>
          </div>
        ))
      )}
    </div>
  );
}
