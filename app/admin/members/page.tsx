import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Pagination } from "@/components/ui/Pagination";

// Member list with contact data: readable here only because RLS grants the
// admin role access to profile_contacts (PRD 9 double defense).
export default async function MembersPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
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
      "id, uid, display_name, company_name, status, is_coordinator, created_at, profile_contacts(email, phone)",
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

  const { data, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const members = (data ?? []) as unknown as {
    id: string;
    uid: number;
    display_name: string | null;
    company_name: string | null;
    status: string;
    is_coordinator: boolean;
    created_at: string;
    profile_contacts: { email: string | null; phone: string | null } | null;
  }[];

  const statusLabels: Record<string, string> = t.admin.memberStatus;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">{t.admin.memberList}</h2>
        <div className="flex items-center gap-2">
        <a href="/admin/members/export" download className="btn-secondary btn-sm">
          {t.admin.exportCsv}
        </a>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={`${t.admin.uid} / ${t.nav.profile}`}
            className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-xl bg-surface-sub px-3 py-2 text-xs font-semibold text-ink-soft"
          >
            {t.common.search}
          </button>
        </form>
        </div>
      </div>

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-surface-sub/60 text-ink-faint">
            <tr>
              <th className="px-3 py-2.5 font-semibold">{t.admin.uid}</th>
              <th className="px-3 py-2.5 font-semibold">{t.nav.profile}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.email}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.joined}</th>
              <th className="px-3 py-2.5 font-semibold">{t.admin.statusLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-surface-sub/40">
                <td className="px-3 py-2.5 font-semibold">{member.uid}</td>
                <td className="px-3 py-2.5">
                  <a
                    href={`/admin/members/${member.id}`}
                    className="font-semibold text-primary-strong hover:underline"
                  >
                    {member.display_name}
                  </a>
                  {member.company_name && (
                    <span className="text-ink-faint"> · {member.company_name}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-soft">
                  {member.profile_contacts?.email}
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

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/members"
        extraQuery={q ? { q } : {}}
        prevLabel={t.home.prev}
        nextLabel={t.home.next}
      />
    </div>
  );
}
