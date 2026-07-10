import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";

// Audit log viewer (D16): who changed what, when. Rows are written by
// log_audit() from every admin action.
export default async function AuditLogPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, target_type, target_id, detail, created_at, profiles(display_name, uid)")
    .order("created_at", { ascending: false })
    .limit(100);

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
    </div>
  );
}
