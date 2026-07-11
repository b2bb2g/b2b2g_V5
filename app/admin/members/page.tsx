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
  searchParams: Promise<{ q?: string; page?: string; role?: string }>;
}) {
  const [{ t }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);

  const PAGE_SIZE = 25;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  let query = supabase
    .from("profiles")
    .select(
      "id, uid, display_name, company_name, status, is_admin, is_coordinator, created_at, profile_contacts(email, phone), member_badges(badge_types(code))",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const q = params.q?.trim();
  if (q) {
    const asNumber = Number(q);
    query = Number.isInteger(asNumber) && asNumber > 0
      ? query.eq("uid", asNumber)
      : query.ilike("display_name", `%${q}%`);
  }
  const role = params.role ?? "";
  if (role === "admin") query = query.eq("is_admin", true);
  if (role === "coordinator") query = query.eq("is_coordinator", true);

  const [{ data, count }, { data: tiers }] = await Promise.all([
    query,
    supabase.from("member_tiers").select("id, name_en").order("sort_order"),
  ]);
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
    profile_contacts: { email: string | null; phone: string | null } | null;
    member_badges: { badge_types: { code: string } | null }[];
  }[];

  const statusLabels: Record<string, string> = t.admin.memberStatus;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">{t.admin.memberList}</h2>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <a href="/admin/members/export" download className="btn-secondary btn-sm">
          {t.admin.exportCsv}
        </a>
        <form className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={`${t.admin.uid} / ${t.nav.profile}`}
            className="min-w-0 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <select name="role" defaultValue={role} className="field w-auto px-2 py-1.5 text-xs">
            <option value="">{t.common.all}</option>
            <option value="admin">{t.common.admin}</option>
            <option value="coordinator">{t.badges.coordinator}</option>
          </select>
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

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-surface-sub/60 text-ink-faint">
            <tr>
              <th className="px-3 py-2.5 font-semibold" aria-hidden="true" />
              <th className="px-3 py-2.5 font-semibold">{t.admin.uid}</th>
              <th className="px-3 py-2.5 font-semibold">{t.nav.profile}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.email}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.role}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.badgeAdmin}</th>
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
                <td className="px-3 py-2.5 text-ink-soft">
                  {member.member_badges.map((badge) => badge.badge_types?.code).filter(Boolean).join(", ") || "-"}
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
      </form>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/members"
        extraQuery={{ ...(q ? { q } : {}), ...(role ? { role } : {}) }}
        prevLabel={t.home.prev}
        nextLabel={t.home.next}
      />
    </div>
  );
}
