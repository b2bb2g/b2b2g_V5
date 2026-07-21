import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewBadgeApplication } from "@/app/actions/admin/reviews";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { PendingButton } from "@/components/ui/PendingButton";
import { Pagination } from "@/components/ui/Pagination";
import {
  grantBadgeToUid,
  revokeMemberBadge,
  saveBadgeType,
  toggleBadgeType,
} from "@/app/actions/admin/badges";

const PAGE_SIZE = 20;

export default async function BadgeAdminPage(props: {
  searchParams: Promise<{ page?: string; toast?: string; error?: string }>;
}) {
  const [{ t, locale }, supabase, params] = await Promise.all([
    getT(),
    createClient(),
    props.searchParams,
  ]);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const [
    { data, count, error: applicationsError },
    { data: badgeTypes, error: badgeTypesError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabase
      .from("badge_applications")
      .select("*, badge_types(name_en, name_ko), profiles!badge_applications_profile_id_fkey(uid, display_name, company_name)", { count: "exact" })
      .eq("status", "pending")
      .order("created_at")
      .range(from, from + PAGE_SIZE - 1),
    supabase.from("badge_types").select("*").order("sort_order"),
    supabase.from("member_badges").select("id, profile_id, granted_at, badge_types(name_en, name_ko, code), profiles!member_badges_profile_id_fkey(uid, display_name, company_name)").order("granted_at", { ascending: false }).limit(20),
  ]);
  const loadError = applicationsError ?? badgeTypesError ?? assignmentsError;
  if (loadError) {
    console.error("[admin/badges] Failed to load badge data", loadError);
    return (
      <div className="space-y-3">
        <h2 className="text-base font-bold">{t.admin.badgeAdmin}</h2>
        <p role="alert" className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative">
          {t.admin.dataLoadFailed}
        </p>
      </div>
    );
  }

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
    <div className="space-y-6">
      <header><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t.admin.operations}</p><h2 className="mt-2 text-2xl font-extrabold">{t.admin.badgeAdmin}</h2></header>
      {params.toast && <p className="rounded-xl bg-positive-soft px-4 py-3 text-sm font-semibold text-positive">{t.admin.changesSaved}</p>}
      {params.error && <p className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative">{t.common.error}</p>}

      <section className="grid gap-4 xl:grid-cols-2">
        <form action={saveBadgeType} className="card space-y-3 p-5">
          <h3 className="font-extrabold">{t.admin.badgeTypeManagement}</h3>
          <div className="grid gap-3 sm:grid-cols-2"><input name="code" required className="field" placeholder={t.admin.badgeExampleCode} aria-label={t.admin.code} /><input name="nameEn" required className="field" placeholder={t.admin.badgeExampleNameEn} aria-label={t.admin.nameEn} /><input name="nameKo" className="field" placeholder={t.admin.badgeExampleNameKo} aria-label={t.admin.nameKo} /><input name="descriptionEn" className="field" placeholder={`${t.admin.description} (EN)`} aria-label={`${t.admin.description} (EN)`} /><input name="descriptionKo" className="field sm:col-span-2" placeholder={`${t.admin.description} (KO)`} aria-label={`${t.admin.description} (KO)`} /></div>
          <PendingButton className="btn-primary btn-md">{t.admin.addBadgeType}</PendingButton>
        </form>
        <form action={grantBadgeToUid} className="card space-y-3 p-5">
          <h3 className="font-extrabold">{t.admin.directBadgeGrant}</h3>
          <div className="grid gap-3 sm:grid-cols-2"><input name="uid" type="number" required className="field" placeholder="UID 100027" /><select name="badgeTypeId" required className="field"><option value="">{t.admin.selectBadge}</option>{(badgeTypes ?? []).filter((badge) => badge.is_active).map((badge) => <option key={badge.id} value={badge.id}>{locale === "ko" ? badge.name_ko : badge.name_en}</option>)}</select></div>
          <PendingButton className="btn-primary btn-md">{t.admin.grantBadge}</PendingButton>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h3 className="font-extrabold">{t.admin.badgeTypeManagement}</h3>
        </div>
        <div className="divide-y divide-line">
          {(badgeTypes ?? []).map((badge) => (
            <details key={badge.id} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {locale === "ko" ? badge.name_ko : badge.name_en}{" "}
                    <span className="font-mono text-xs text-ink-faint">
                      {badge.code}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {locale === "ko"
                      ? badge.description_ko
                      : badge.description_en}
                  </p>
                </div>
                <span className="text-xs font-bold text-primary">
                  {t.common.edit} ↓
                </span>
              </summary>
              <div className="mt-4 grid gap-3 border-t border-line pt-4 lg:grid-cols-[1fr_auto]">
                <form
                  action={saveBadgeType}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={badge.id} />
                  <input
                    name="code"
                    required
                    defaultValue={badge.code}
                    className="field"
                    aria-label="Badge code"
                  />
                  <input
                    name="nameEn"
                    required
                    defaultValue={badge.name_en}
                    className="field"
                    aria-label="Badge name English"
                  />
                  <input
                    name="nameKo"
                    defaultValue={badge.name_ko}
                    className="field"
                    aria-label="Badge name Korean"
                  />
                  <input
                    name="descriptionEn"
                    defaultValue={badge.description_en ?? ""}
                    className="field"
                    placeholder={`${t.admin.description} (EN)`}
                  />
                  <input
                    name="descriptionKo"
                    defaultValue={badge.description_ko ?? ""}
                    className="field sm:col-span-2"
                    placeholder={`${t.admin.description} (KO)`}
                  />
                  <PendingButton className="btn-secondary btn-sm sm:col-span-2 sm:justify-self-start">
                    {t.common.save}
                  </PendingButton>
                </form>
                <form action={toggleBadgeType}>
                  <input type="hidden" name="id" value={badge.id} />
                  <input
                    type="hidden"
                    name="isActive"
                    value={(!badge.is_active).toString()}
                  />
                  <PendingButton
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      badge.is_active
                        ? "bg-positive-soft text-positive"
                        : "bg-surface-sub text-ink-faint"
                    }`}
                  >
                    {badge.is_active ? t.common.on : t.common.off}
                  </PendingButton>
                </form>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-3">
      <h3 className="text-base font-bold">{t.admin.pendingBadges}</h3>
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
      </section>

      <section className="card overflow-hidden"><div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.recentBadgeAssignments}</h3></div>{assignments?.length ? <div className="divide-y divide-line">{assignments.map((assignment) => {
        const profile = Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles;
        const badge = Array.isArray(assignment.badge_types) ? assignment.badge_types[0] : assignment.badge_types;
        return <article key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-bold">UID:{profile?.uid} · {locale === "ko" ? badge?.name_ko : badge?.name_en}</p><p className="mt-1 text-xs text-ink-faint">{profile?.company_name ?? profile?.display_name ?? "—"}</p></div><form action={revokeMemberBadge}><input type="hidden" name="id" value={assignment.id} /><input type="hidden" name="profileId" value={assignment.profile_id} /><PendingButton className="btn-danger btn-sm">{t.admin.revokeBadge}</PendingButton></form></article>;
      })}</div> : null}</section>
    </div>
  );
}
