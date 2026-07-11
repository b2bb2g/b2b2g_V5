import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { updateSetting } from "@/app/actions/admin";

// Global switchboard (PRD 17.11): every policy value is editable here.
export default async function SettingsAdminPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data } = await supabase
    .from("site_settings")
    .select("key, value, is_public")
    .order("key");

  const settings = (data ?? []) as { key: string; value: unknown }[];
  // Human-readable names; the raw key stays visible as a small reference.
  const labels: Record<string, string> = t.admin.settingLabels;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold">{t.admin.settings}</h2>
      <div className="space-y-2">
        {settings.map((setting) => {
          const isBool = typeof setting.value === "boolean";
          const isNumber = typeof setting.value === "number";
          return (
            <form
              key={setting.key}
              action={updateSetting}
              className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line px-4 py-3"
            >
              <input type="hidden" name="key" value={setting.key} />
              <span className="min-w-0">
                <p className="text-sm font-semibold">
                  {labels[setting.key] ?? setting.key}
                </p>
                <p className="font-mono text-[10px] text-ink-faint">{setting.key}</p>
              </span>
              {isBool ? (
                <>
                  <input type="hidden" name="kind" value="boolean" />
                  <input
                    type="hidden"
                    name="value"
                    value={(!(setting.value as boolean)).toString()}
                  />
                  <button
                    type="submit"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      setting.value
                        ? "bg-positive-soft text-positive"
                        : "bg-surface-sub text-ink-faint"
                    }`}
                  >
                    {setting.value ? t.common.on : t.common.off}
                  </button>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <input type="hidden" name="kind" value={isNumber ? "number" : "string"} />
                  <input
                    name="value"
                    defaultValue={
                      isNumber
                        ? String(setting.value)
                        : String((setting.value as string) ?? "")
                    }
                    className="w-56 rounded-xl border border-line px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-surface-sub px-3 py-1.5 text-xs font-semibold text-ink-soft"
                  >
                    {t.common.save}
                  </button>
                </span>
              )}
            </form>
          );
        })}
      </div>
    </div>
  );
}
