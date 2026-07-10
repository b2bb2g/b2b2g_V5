import { MemberArea } from "@/components/layout/MemberArea";
import { InAppGuard } from "@/components/layout/InAppGuard";
import { getT } from "@/lib/i18n/server";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import { SETTING_KEYS } from "@/lib/constants";

// The write flow is part of the member area: same tabs, same frame.
// File uploads steer out of in-app browsers (PRD 13).
export default async function WriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ t }, settings] = await Promise.all([getT(), getPublicSettings()]);
  return (
    <MemberArea>
      <InAppGuard
        enabled={settingBool(settings, SETTING_KEYS.INAPP_REDIRECT_ENABLED, true)}
        title={t.inapp.title}
        body={t.inapp.body}
        openLabel={t.inapp.open}
      />
      {children}
    </MemberArea>
  );
}
