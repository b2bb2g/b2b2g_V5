import { getT } from "@/lib/i18n/server";
import { signOut, updatePassword } from "@/app/actions/auth";
import { PasswordInput } from "@/components/ui/TextField";
import { PendingButton } from "@/components/ui/PendingButton";

export default async function ResetUpdatePage(props: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getT(), props.searchParams]);

  const errorMessage =
    params.error === "same"
      ? t.auth.samePassword
      : params.error === "weak"
        ? t.auth.weakPassword
        : params.error
          ? t.common.error
          : null;

  return (
    <div className="w-full">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.auth.accountRecovery}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{t.auth.updatePassword}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.auth.setNewPasswordHint}</p>

      {params.notice === "used" && (
        <p className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-xs font-semibold text-primary-strong">
          {t.auth.linkAlreadyUsed}
        </p>
      )}

      {errorMessage && (
        <p className="mt-3 rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {errorMessage}
        </p>
      )}

      <form action={updatePassword} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-ink-soft">{t.auth.newPassword}</span>
          <div className="mt-1">
            <PasswordInput
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              clearLabel={t.common.clearInput}
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
          </div>
        </label>
        <PendingButton className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong disabled:opacity-60">{t.auth.updatePassword}</PendingButton>
      </form>

      {/* Escape hatch: signs out and keeps the existing password valid. */}
      <form action={signOut} className="mt-3">
        <PendingButton className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-sub px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-line/60 disabled:opacity-60">{t.auth.keepCurrentPassword}</PendingButton>
      </form>
    </div>
  );
}
