import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { updateSetting } from "@/app/actions/admin";
import { PendingButton } from "@/components/ui/PendingButton";

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
  const groupOf = (key: string) => {
    if (/^(site_|seo_|robots_|google_|naver_)/.test(key)) return "discovery";
    if (/^email_notify_/.test(key)) return "notifications";
    if (/^(pwa_|inapp_|upload_)/.test(key)) return "experience";
    if (/^(signup_|referral_invite_|login_session_|new_device_|suspicious_login_|failed_login_|security_log_)/.test(key)) return "security";
    if (/^(bootstrap_)/.test(key)) return "access";
    return "policy";
  };
  const groups = Object.groupBy(settings, (setting) => groupOf(setting.key));

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold">{t.admin.settings}</h2>
      <div className="space-y-6">
        {Object.entries(groups).map(([group, groupSettings]) => (
          <section key={group} className="space-y-2">
            <h3 className="border-b border-line pb-2 text-sm font-bold text-ink-soft">
              {t.admin.settingGroups[group as keyof typeof t.admin.settingGroups]}
            </h3>
        {(groupSettings ?? []).map((setting) => {
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
                  <PendingButton
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      setting.value
                        ? "bg-positive-soft text-positive"
                        : "bg-surface-sub text-ink-faint"
                    }`}
                  >
                    {setting.value ? t.common.on : t.common.off}
                  </PendingButton>
                </>
              ) : setting.key === "signup_mode" || setting.key === "login_session_policy" ? (
                <span className="flex items-center gap-2">
                  <input type="hidden" name="kind" value="string" />
                  <select
                    name="value"
                    defaultValue={String(setting.value)}
                    className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    {(setting.key === "signup_mode"
                      ? ["open", "invite_only", "paused"]
                      : ["multi", "single"]
                    ).map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <PendingButton className="rounded-lg bg-surface-sub px-3 py-1.5 text-xs font-semibold text-ink-soft">
                    {t.common.save}
                  </PendingButton>
                </span>
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
                  <PendingButton
                    className="rounded-lg bg-surface-sub px-3 py-1.5 text-xs font-semibold text-ink-soft"
                  >
                    {t.common.save}
                  </PendingButton>
                </span>
              )}
            </form>
          );
        })}
          </section>
        ))}
      </div>
    </div>
  );
}
