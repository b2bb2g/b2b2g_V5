import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewBadgeApplication } from "@/app/actions/admin/reviews";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { PendingButton } from "@/components/ui/PendingButton";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 20;

export default async function BadgeAdminPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ t, locale }, supabase, params] = await Promise.all([
    getT(),
    createClient(),
    props.searchParams,
  ]);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from("badge_applications")
    .select("*, badge_types(name_en, name_ko), profiles(uid, display_name, company_name)", { count: "exact" })
    .eq("status", "pending")
    .order("created_at")
    .range(from, from + PAGE_SIZE - 1);

  const rows = (data ?? []) as unknown as {
    id: string;
    company_info: { note?: string };
    document_paths: string[] | null;
    created_at: string;
    badge_types: { name_en: string; name_ko: string } | null;
    profiles: { uid: number; display_name: string | null; company_name: string | null } | null;
  }[];

  // Submitted documents open via short-lived signed URLs (admin-only bucket RLS).
  const applications = await Promise.all(
    rows.map(async (app) => ({
      ...app,
      docs: await Promise.all(
        (app.document_paths ?? []).map(async (path) => {
          const { data: signed } = await supabase.storage
            .from(STORAGE_BUCKETS.BADGE_DOCS)
            .createSignedUrl(path, 600);
          return {
            name: path.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") ?? path,
            url: signed?.signedUrl ?? null,
          };
        })
      ),
    }))
  );

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
            {app.docs.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-ink-faint">
                  {t.badges.documents}
                </p>
                <ul className="mt-1 space-y-1">
                  {app.docs.map(
                    (doc) =>
                      doc.url && (
                        <li key={doc.url}>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-primary-strong hover:underline"
                          >
                            {doc.name}
                          </a>
                        </li>
                      )
                  )}
                </ul>
              </div>
            )}
            <form action={reviewBadgeApplication} className="mt-3 space-y-2">
              <input type="hidden" name="applicationId" value={app.id} />
              <input
                name="reason"
                required
                placeholder={t.admin.rejectReason}
                className="w-full rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <PendingButton
                  type="submit"
                  formNoValidate
                  name="decision"
                  value="approve"
                  className="flex-1 rounded-xl bg-positive px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.approve}
                </PendingButton>
                <PendingButton
                  type="submit"
                  name="decision"
                  value="reject"
                  className="flex-1 rounded-xl bg-negative px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.reject}
                </PendingButton>
              </div>
            </form>
          </div>
        ))
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} basePath="/admin/badges" prevLabel={t.home.prev} nextLabel={t.home.next} />
    </div>
  );
}
