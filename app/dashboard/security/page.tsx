import { redirect } from "next/navigation";
import { getSession } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { currentDeviceHash } from "@/lib/security";
import { PendingButton } from "@/components/ui/PendingButton";
import {
  revokeDeviceSession,
  signOutEverywhere,
  signOutOtherSessions,
} from "@/app/actions/security";
import { MfaPanel } from "@/components/security/MfaPanel";
import { AppLockPanel } from "@/components/security/AppLockPanel";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";

export default async function SecurityPage(props: {
  searchParams: Promise<{ mfa?: string; next?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const [{ t, locale }, supabase, currentHash, params] = await Promise.all([
    getT(),
    createClient(),
    currentDeviceHash(),
    props.searchParams,
  ]);
  const mfaRequired = params.mfa === "required";
  const returnTo = params.next === "/admin" || params.next?.startsWith("/admin/")
    ? params.next
    : "/admin";
  const [
    { data: devices },
    { data: events },
    { data: factors },
    { data: level },
  ] = await Promise.all([
    supabase
      .from("trusted_devices")
      .select("id, device_hash, label, last_ip_masked, last_country, last_seen_at, created_at")
      .eq("profile_id", session.userId)
      .order("last_seen_at", { ascending: false }),
    supabase
      .from("login_events")
      .select("id, device_label, ip_masked, country, city, risk_level, is_new_device, created_at")
      .eq("profile_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  const verifiedFactor = factors?.totp?.find((factor) => factor.status === "verified") ?? null;
  if (mfaRequired && verifiedFactor && level?.currentLevel === "aal2") {
    redirect(returnTo);
  }
  const format = (value: string) => new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
  const mfaPanel = (
    <MfaPanel
      isAdmin={Boolean(session.profile?.is_admin)}
      required={mfaRequired}
      returnTo={returnTo}
      initialFactor={verifiedFactor ? {
        id: verifiedFactor.id,
        status: verifiedFactor.status,
        friendly_name: verifiedFactor.friendly_name,
      } : null}
      initialAal={level?.currentLevel ?? null}
      labels={{
        title: t.security.mfaTitle,
        description: t.security.mfaDescription,
        adminRequired: t.security.mfaAdminRequired,
        challengeTitle: t.security.mfaChallengeTitle,
        challengeDescription: t.security.mfaChallengeDescription,
        continue: t.security.mfaContinue,
        enabled: t.security.mfaEnabled,
        enroll: t.security.mfaEnroll,
        scan: t.security.mfaScan,
        code: t.security.mfaCode,
        verify: t.security.mfaVerify,
        remove: t.security.mfaRemove,
        error: t.security.mfaError,
        showPassword: t.auth.showPassword,
        hidePassword: t.auth.hidePassword,
        lostDevice: t.security.mfaLostDevice,
        resetHint: t.security.mfaResetHint,
        sendResetCode: t.security.mfaSendResetCode,
        resetCodeSent: t.security.mfaResetCodeSent,
        resetThrottled: t.security.mfaResetThrottled,
        confirmReset: t.security.mfaConfirmReset,
        resetDone: t.security.mfaResetDone,
      }}
    />
  );

  if (mfaRequired) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-4 sm:py-8">
        <section className="overflow-hidden rounded-[1.5rem] bg-[#101923] px-5 py-6 text-white shadow-[0_18px_55px_rgba(16,25,35,.16)] sm:px-7 sm:py-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="11" x="5" y="11" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#79b4ff]">{t.security.mfaGateEyebrow}</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-[-.035em]">{t.security.mfaGateTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">{t.security.mfaGateDescription}</p>
            </div>
          </div>
        </section>
        {mfaPanel}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <WorkspacePageHeader
        title={t.security.title}
        description={t.security.description}
        action={
          <>
            <form action={signOutOtherSessions}>
              <PendingButton className="btn-secondary btn-md">{t.security.signOutOthers}</PendingButton>
            </form>
            <form action={signOutEverywhere}>
              <PendingButton className="rounded-xl bg-negative-soft px-4 py-2.5 text-sm font-bold text-negative">{t.security.signOutAll}</PendingButton>
            </form>
          </>
        }
      />

      {mfaPanel}

      <AppLockPanel
        userLabel={`UID:${session.profile?.uid ?? ""}`}
        labels={{
          title: t.security.lockPanelTitle,
          description: t.security.lockPanelDescription,
          biometricReady: t.security.lockBiometricReady,
          biometricMissing: t.security.lockBiometricMissing,
          pinLabel: t.security.lockPinLabel,
          pinConfirmLabel: t.security.lockPinConfirmLabel,
          pinMismatch: t.security.lockPinMismatch,
          enableWithBiometric: t.security.lockEnableBiometric,
          enablePinOnly: t.security.lockEnablePinOnly,
          enabledBadge: t.security.lockEnabledBadge,
          enabledBiometric: t.security.lockEnabledBiometric,
          enabledPinOnly: t.security.lockEnabledPinOnly,
          disable: t.security.lockDisable,
          verifyToDisable: t.security.lockVerifyToDisable,
          error: t.security.mfaError,
          showPin: t.auth.showPassword,
          hidePin: t.auth.hidePassword,
        }}
      />

      <section className="rounded-[1.5rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-7">
        <h3 className="text-base font-extrabold">{t.security.devices}</h3>
        <p className="mt-1 text-xs text-ink-faint">{t.security.devicesHint}</p>
        <ul className="mt-4 divide-y divide-line">
          {(devices ?? []).map((device) => {
            const isCurrent = currentHash === device.device_hash;
            return (
              <li key={device.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-bold">{device.label} {isCurrent && <span className="ml-2 rounded-full bg-positive-soft px-2 py-1 text-[10px] text-positive">{t.security.current}</span>}</p>
                  <p className="mt-1 text-xs text-ink-faint">{[device.last_country, device.last_ip_masked].filter(Boolean).join(" · ")} · {format(device.last_seen_at)}</p>
                </div>
                {!isCurrent && (
                  <form action={revokeDeviceSession}>
                    <input type="hidden" name="deviceId" value={device.id} />
                    <PendingButton className="rounded-lg px-3 py-2 text-xs font-bold text-negative hover:bg-negative-soft">{t.security.revoke}</PendingButton>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-[1.5rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-7">
        <h3 className="text-base font-extrabold">{t.security.history}</h3>
        <p className="mt-1 text-xs text-ink-faint">{t.security.historyHint}</p>
        <ul className="mt-4 divide-y divide-line">
          {(events ?? []).map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-bold">{event.device_label || t.security.unknownDevice}</p>
                <p className="mt-1 text-xs text-ink-faint">{[event.city, event.country, event.ip_masked].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="text-right">
                {event.risk_level !== "normal" && <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${event.risk_level === "high" ? "bg-negative-soft text-negative" : "bg-warning-soft text-warning"}`}>{event.risk_level === "high" ? t.security.highRisk : t.security.newDevice}</span>}
                <p className="mt-1 text-[11px] text-ink-faint">{format(event.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
