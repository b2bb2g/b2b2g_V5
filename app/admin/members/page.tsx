import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Pagination } from "@/components/ui/Pagination";
import { bulkMemberAction } from "@/app/actions/admin";
import { PendingButton } from "@/components/ui/PendingButton";
import Link from "next/link";

// Member list with contact data: readable here only because RLS grants the
// admin role access to profile_contacts (PRD 9 double defense).
export default async function MembersPage(props: {
  searchParams: Promise<{ q?: string; page?: string; role?: string; status?: string; tier?: string; badge?: string; from?: string; to?: string }>;
}) {
  const [{ t }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);

  const PAGE_SIZE = 25;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const q = params.q?.trim().replace(/[%,()\\]/g, "");
  let relationLookupError: { message: string } | null = null;
  let matchedEmailIds: string[] = [];
  if (q && !/^\d+$/.test(q)) {
    const { data: contacts, error } = await supabase.from("profile_contacts").select("profile_id").ilike("email", `%${q}%`).limit(100);
    relationLookupError = error;
    matchedEmailIds = (contacts ?? []).map((row) => row.profile_id);
  }

  let badgeProfileIds: string[] | null = null;
  if (params.badge) {
    const { data: matches, error } = await supabase.from("member_badges").select("profile_id, badge_types!inner(code)").eq("badge_types.code", params.badge);
    relationLookupError ??= error;
    badgeProfileIds = (matches ?? []).map((row) => row.profile_id);
  }

  let query = supabase
    .from("profiles")
    .select(
      "id, uid, display_name, company_name, status, tier_id, is_admin, is_coordinator, created_at, profile_contacts(email, phone), member_tiers(name_en), member_badges!member_badges_profile_id_fkey(badge_types(code))",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (q) {
    const asNumber = Number(q);
    query = Number.isInteger(asNumber) && asNumber > 0
      ? query.eq("uid", asNumber)
      : query.or(`display_name.ilike.%${q}%,company_name.ilike.%${q}%${matchedEmailIds.length ? `,id.in.(${matchedEmailIds.join(",")})` : ""}`);
  }
  const role = params.role ?? "";
  if (role === "admin") query = query.eq("is_admin", true);
  if (role === "coordinator") query = query.eq("is_coordinator", true);
  if (params.status) query = query.eq("status", params.status);
  if (params.tier) query = query.eq("tier_id", params.tier);
  if (params.from) query = query.gte("created_at", params.from);
  if (params.to) query = query.lte("created_at", `${params.to}T23:59:59Z`);
  if (badgeProfileIds) query = query.in("id", badgeProfileIds.length ? badgeProfileIds : ["00000000-0000-0000-0000-000000000000"]);

  const [
    { data, count, error: membersError },
    { data: tiers, error: tiersError },
    { data: badgeTypes, error: badgeTypesError },
  ] = await Promise.all([
    query,
    supabase.from("member_tiers").select("id, name_en").order("sort_order"),
    supabase.from("badge_types").select("code, name_en").eq("is_active", true).order("sort_order"),
  ]);
  const loadError = relationLookupError ?? membersError ?? tiersError ?? badgeTypesError;
  if (loadError) {
    console.error("[admin/members] Failed to load member data", loadError);
    return (
      <div className="space-y-3">
        <h2 className="text-base font-bold">{t.admin.memberList}</h2>
        <p role="alert" className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative">
          {t.admin.dataLoadFailed}
        </p>
      </div>
    );
  }
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const members = (data ?? []) as unknown as {
    id: string;
    uid: number;
    display_name: string | null;
    company_name: string | null;
    status: string;
    is_coordinator: boolean;
    is_admin: boolean;
    created_at: string;
    member_tiers: { name_en: string } | null;
    profile_contacts: { email: string | null; phone: string | null } | null;
    member_badges: { badge_types: { code: string } | null }[];
  }[];

  // Marketing consent lives in the owner/admin-only profile_private table.
  const { data: marketingRows } = await supabase
    .from("profile_private")
    .select("profile_id")
    .eq("marketing_consent", true)
    .in(
      "profile_id",
      members.map((m) => m.id),
    );
  const marketingOptedIds = new Set(
    (marketingRows ?? []).map((r) => r.profile_id as string),
  );

  const statusLabels: Record<string, string> = t.admin.memberStatus;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">{t.admin.memberList}</h2>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <a href="/admin/members/export" download className="btn-secondary btn-sm">
          {t.admin.exportCsv}
        </a>
        <a
          href="/admin/members/export?marketing=opted"
          download
          className="btn-secondary btn-sm"
        >
          {t.admin.exportMarketing}
        </a>
        <form className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={`${t.admin.uid} / ${t.nav.profile} / ${t.admin.email}`}
            className="field col-span-2 min-w-0 px-3 py-2 text-xs"
          />
          <select name="role" defaultValue={role} className="field w-auto px-2 py-1.5 text-xs">
            <option value="">{t.common.all}</option>
            <option value="admin">{t.common.admin}</option>
            <option value="coordinator">{t.badges.coordinator}</option>
          </select>
          <select name="status" defaultValue={params.status ?? ""} className="field w-auto px-2 py-1.5 text-xs"><option value="">{t.admin.statusLabel}: {t.common.all}</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select name="tier" defaultValue={params.tier ?? ""} className="field w-auto px-2 py-1.5 text-xs"><option value="">{t.admin.tiers}: {t.common.all}</option>{(tiers ?? []).map((tier) => <option key={tier.id} value={tier.id}>{tier.name_en}</option>)}</select>
          <select name="badge" defaultValue={params.badge ?? ""} className="field w-auto px-2 py-1.5 text-xs"><option value="">{t.admin.badgeAdmin}: {t.common.all}</option>{(badgeTypes ?? []).map((badge) => <option key={badge.code} value={badge.code}>{badge.name_en}</option>)}</select>
          <input name="from" type="date" defaultValue={params.from ?? ""} aria-label={t.admin.dateFrom} className="field px-2 py-1.5 text-xs" />
          <input name="to" type="date" defaultValue={params.to ?? ""} aria-label={t.admin.dateTo} className="field px-2 py-1.5 text-xs" />
          <button
            type="submit"
            className="rounded-xl bg-surface-sub px-3 py-2 text-xs font-semibold text-ink-soft"
          >
            {t.common.search}
          </button>
        </form>
        </div>
      </div>

      {/* Bulk actions (PRD 17.2): select rows, pick an action, confirm */}
      <form action={bulkMemberAction} className="space-y-3">
        <div className="card grid gap-2 px-4 py-3 sm:flex sm:flex-wrap sm:items-center">
          <p className="text-xs font-bold text-ink-soft">{t.admin.bulkAction}</p>
          <select name="bulkAction" className="field w-auto px-2 py-1.5 text-xs">
            <option value="notify">{t.admin.bulkNotify}</option>
            <option value="tier">{t.admin.bulkTier}</option>
          </select>
          <input
            name="message"
            placeholder={t.admin.bulkMessage}
            className="field w-full px-2 py-1.5 text-xs sm:w-56"
          />
          <select name="tierId" className="field w-auto px-2 py-1.5 text-xs">
            <option value="">{t.admin.tiers}</option>
            {(tiers ?? []).map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name_en}
              </option>
            ))}
          </select>
          <PendingButton className="btn-primary btn-sm">
            {t.admin.bulkSelected}
          </PendingButton>
        </div>

      <div className="hidden overflow-x-auto rounded-card border border-line md:block">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-surface-sub/60 text-ink-faint">
            <tr>
              <th className="px-3 py-2.5 font-semibold" aria-hidden="true" />
              <th className="px-3 py-2.5 font-semibold">{t.admin.uid}</th>
              <th className="px-3 py-2.5 font-semibold">{t.nav.profile}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.email}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.role}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.tiers}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.badgeAdmin}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.marketing}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.joined}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.statusLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-surface-sub/40">
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    name="ids"
                    value={member.id}
                    aria-label={String(member.uid)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                </td>
                <td className="px-3 py-2.5 font-semibold">{member.uid}</td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/members/${member.id}`}
                    className="font-semibold text-primary-strong hover:underline"
                  >
                    {member.display_name}
                  </Link>
                  {member.company_name && (
                    <span className="text-ink-faint"> · {member.company_name}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-soft">
                  {member.profile_contacts?.email}
                </td>
                <td className="px-3 py-2.5 text-ink-soft">
                  {member.is_admin ? t.common.admin : member.is_coordinator ? t.badges.coordinator : t.admin.memberRole}
                </td>
                <td className="px-3 py-2.5 text-ink-soft">{member.member_tiers?.name_en ?? "-"}</td>
                <td className="px-3 py-2.5 text-ink-soft">
                  {member.member_badges.map((badge) => badge.badge_types?.code).filter(Boolean).join(", ") || "-"}
                </td>
                <td className="px-3 py-2.5">
                  {marketingOptedIds.has(member.id) ? (
                    <span className="rounded-full bg-positive-soft px-2 py-0.5 text-[11px] font-bold text-positive">
                      {t.admin.marketingYes}
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-faint">
                  {new Date(member.created_at).toISOString().slice(0, 10)}
                </td>
                <td className="px-3 py-2.5">
                  <StatusLabel
                    status={member.status}
                    label={statusLabels[member.status] ?? member.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 md:hidden">
        {members.map((member) => (
          <article key={member.id} className="rounded-2xl border border-line bg-surface p-4 shadow-(--shadow-card)">
            <div className="flex items-start gap-3">
              <input type="checkbox" name="ids" value={member.id} aria-label={String(member.uid)} className="mt-1 h-4 w-4 rounded accent-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-ink-faint">UID {member.uid}</p><Link href={`/admin/members/${member.id}`} className="mt-1 block truncate text-sm font-extrabold text-primary-strong">{member.display_name}</Link></div><StatusLabel status={member.status} label={statusLabels[member.status] ?? member.status} /></div>
                {member.company_name && <p className="mt-1 truncate text-xs text-ink-soft">{member.company_name}</p>}
                <p className="mt-2 truncate text-xs text-ink-soft">{member.profile_contacts?.email ?? "-"}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-surface-sub p-3 text-xs"><div><dt className="font-semibold text-ink-faint">{t.admin.role}</dt><dd className="mt-0.5 text-ink-soft">{member.is_admin ? t.common.admin : member.is_coordinator ? t.badges.coordinator : t.admin.memberRole}</dd></div><div><dt className="font-semibold text-ink-faint">{t.admin.tiers}</dt><dd className="mt-0.5 text-ink-soft">{member.member_tiers?.name_en ?? "-"}</dd></div><div><dt className="font-semibold text-ink-faint">{t.admin.badgeAdmin}</dt><dd className="mt-0.5 text-ink-soft">{member.member_badges.map((badge) => badge.badge_types?.code).filter(Boolean).join(", ") || "-"}</dd></div><div><dt className="font-semibold text-ink-faint">{t.admin.joined}</dt><dd className="mt-0.5 text-ink-soft">{new Date(member.created_at).toISOString().slice(0,10)}</dd></div><div><dt className="font-semibold text-ink-faint">{t.admin.marketing}</dt><dd className={`mt-0.5 font-semibold ${marketingOptedIds.has(member.id) ? "text-positive" : "text-ink-faint"}`}>{marketingOptedIds.has(member.id) ? t.admin.marketingYes : "—"}</dd></div></dl>
              </div>
            </div>
          </article>
        ))}
      </div>
      </form>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/members"
        extraQuery={{ ...(q ? { q } : {}), ...(role ? { role } : {}), ...(params.status ? { status: params.status } : {}), ...(params.tier ? { tier: params.tier } : {}), ...(params.badge ? { badge: params.badge } : {}), ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}) }}
        prevLabel={t.home.prev}
        nextLabel={t.home.next}
      />
    </div>
  );
}
