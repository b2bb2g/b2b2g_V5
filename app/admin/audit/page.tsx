import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

// Audit log viewer (D16): who changed what, when. Rows are written by
// log_audit() from every admin action.
export default async function AuditLogPage(props: {
  searchParams: Promise<{ page?: string; action?: string; uid?: string; from?: string; to?: string }>;
}) {
  const [{ t }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);
  const PAGE_SIZE = 50;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  // Filters (D16): action substring, actor UID, date range.
  const actionQuery = (params.action ?? "").trim().replace(/[%,()\\]/g, "");
  const uidQuery = Number.parseInt(params.uid ?? "", 10);
  const dateFrom = (params.from ?? "").trim();
  const dateTo = (params.to ?? "").trim();

  let actorId: string | null = null;
  if (Number.isFinite(uidQuery)) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("id")
      .eq("uid", uidQuery)
      .maybeSingle();
    actorId = actor?.id ?? "00000000-0000-0000-0000-000000000000";
  }

  let query = supabase
    .from("audit_logs")
    .select("id, action, target_type, target_id, detail, created_at, profiles(display_name, uid)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (actionQuery) query = query.ilike("action", `%${actionQuery}%`);
  if (actorId) query = query.eq("actor_id", actorId);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59Z`);
  const { data, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const logs = (data ?? []) as unknown as {
    id: string;
    action: string;
    target_type: string | null;
    target_id: string | null;
    detail: Record<string, unknown>;
    created_at: string;
    profiles: { display_name: string | null; uid: number } | null;
  }[];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold">{t.admin.auditLog}</h2>

      <form action="/admin/audit" method="get" className="flex flex-wrap items-end gap-2">
        <input
          name="action"
          defaultValue={params.action ?? ""}
          placeholder={t.admin.action}
          className="w-40 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
        />
        <input
          name="uid"
          type="number"
          defaultValue={params.uid ?? ""}
          placeholder={t.admin.uid}
          className="w-28 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
        />
        <label className="text-xs text-ink-faint">
          {t.admin.dateFrom}
          <input
            name="from"
            type="date"
            defaultValue={params.from ?? ""}
            className="ml-1.5 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
        </label>
        <label className="text-xs text-ink-faint">
          {t.admin.dateTo}
          <input
            name="to"
            type="date"
            defaultValue={params.to ?? ""}
            className="ml-1.5 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
        </label>
        <button type="submit" className="rounded-xl bg-surface-sub px-4 py-2 text-xs font-bold text-ink-soft hover:bg-line/60">
          {t.admin.filter}
        </button>
      </form>
      {logs.length === 0 ? (
        <EmptyState title={t.common.emptyList} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-surface-sub/60 text-ink-faint">
              <tr>
                <th className="px-3 py-2.5 font-semibold">{t.admin.when}</th>
                <th className="px-3 py-2.5 font-semibold">{t.admin.actor}</th>
                <th className="px-3 py-2.5 font-semibold">{t.admin.action}</th>
                <th className="px-3 py-2.5 font-semibold">{t.admin.target}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-3 py-2.5 text-ink-faint">
                    {new Date(log.created_at).toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-3 py-2.5">
                    {log.profiles?.display_name ?? "-"}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-ink-soft">
                    {log.action}
                  </td>
                  <td className="max-w-48 truncate px-3 py-2.5 text-ink-faint">
                    {log.target_type}
                    {log.target_id ? ` · ${log.target_id.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/audit"
        extraQuery={{
          ...(params.action ? { action: params.action } : {}),
          ...(params.uid ? { uid: params.uid } : {}),
          ...(params.from ? { from: params.from } : {}),
          ...(params.to ? { to: params.to } : {}),
        }}
        prevLabel={t.home.prev}
        nextLabel={t.home.next}
      />
    </div>
  );
}
