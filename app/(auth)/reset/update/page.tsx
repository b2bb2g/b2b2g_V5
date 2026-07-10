import { getT } from "@/lib/i18n/server";
import { signOut, updatePassword } from "@/app/actions/auth";

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
    <div className="mx-auto max-w-sm py-8">
      <h1 className="text-xl font-extrabold">{t.auth.updatePassword}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.auth.setNewPasswordHint}</p>

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

      <form action={updatePassword} className="mt-6 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">{t.auth.newPassword}</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong"
        >
          {t.auth.updatePassword}
        </button>
      </form>

      {/* Escape hatch: signs out and keeps the existing password valid. */}
      <form action={signOut} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-xl bg-surface-sub px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-line/60"
        >
          {t.auth.keepCurrentPassword}
        </button>
      </form>
    </div>
  );
}
