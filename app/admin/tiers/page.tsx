import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { addTier, toggleTierPermission } from "@/app/actions/admin";
import { PERMISSION_ACTIONS } from "@/lib/constants";

// D11: dynamic tiers and the tier x action permission matrix (PRD 2.3, 17.3).
// The free-member post limit lives in system settings (free_post_limit).
export default async function TiersAdminPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const [{ data: tiers }, { data: permissions }] = await Promise.all([
    supabase.from("member_tiers").select("*").order("sort_order"),
    supabase.from("tier_permissions").select("*"),
  ]);

  const actions = Object.values(PERMISSION_ACTIONS);
  const actionLabels: Record<string, string> = t.admin.permissions;
  const permissionMap = new Map(
    (permissions ?? []).map((p) => [`${p.tier_id}:${p.action}`, p.allowed as boolean])
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-base font-bold">{t.admin.tiers}</h2>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="bg-surface-sub/60 text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t.admin.tiers}</th>
                {actions.map((action) => (
                  <th key={action} className="px-4 py-2.5 text-center font-semibold">
                    {actionLabels[action] ?? action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(tiers ?? []).map((tier) => (
                <tr key={tier.id}>
                  <td className="px-4 py-2.5">
                    <span className="font-bold">{tier.name_en}</span>
                    <span className="ml-2 font-mono text-[11px] text-ink-faint">
                      {tier.code}
                    </span>
                    {tier.is_paid && (
                      <span className="ml-2 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary-strong">
                        {t.admin.paidTier}
                      </span>
                    )}
                  </td>
                  {actions.map((action) => {
                    const allowed = permissionMap.get(`${tier.id}:${action}`) ?? false;
                    return (
                      <td key={action} className="px-4 py-2.5 text-center">
                        <form action={toggleTierPermission} className="inline">
                          <input type="hidden" name="tierId" value={tier.id} />
                          <input type="hidden" name="action" value={action} />
                          <input type="hidden" name="allowed" value={(!allowed).toString()} />
                          <button
                            type="submit"
                            className={`btn-sm rounded-lg font-semibold ${
                              allowed
                                ? "bg-positive-soft text-positive"
                                : "bg-surface-sub text-ink-faint"
                            }`}
                          >
                            {allowed ? t.common.on : t.common.off}
                          </button>
                        </form>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form action={addTier} className="card max-w-lg space-y-2 p-4">
        <p className="text-sm font-bold">{t.admin.addTier}</p>
        <div className="grid grid-cols-3 gap-2">
          <input name="code" required placeholder={t.admin.tierCode} className="field px-2 py-1.5 text-xs" />
          <input name="nameEn" required placeholder={t.admin.nameEn} className="field px-2 py-1.5 text-xs" />
          <input name="nameKo" placeholder={t.admin.nameKo} className="field px-2 py-1.5 text-xs" />
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          <input type="checkbox" name="isPaid" className="h-4 w-4 rounded accent-primary" />
          {t.admin.paidTier}
        </label>
        <button type="submit" className="btn-primary btn-sm">
          {t.common.add}
        </button>
      </form>
    </div>
  );
}
