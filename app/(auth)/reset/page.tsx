import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { requestPasswordReset } from "@/app/actions/auth";
import { CaptchaSubmit } from "@/components/auth/CaptchaField";
import { ClearableInput } from "@/components/ui/TextField";

export default async function ResetPage(props: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getT(), props.searchParams]);

  return (
    <div className="w-full">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.auth.accountRecovery}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{t.auth.resetTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.auth.resetBody}</p>

      {params.sent ? (
        <div className="mt-8 rounded-2xl border border-positive/20 bg-positive-soft p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-positive text-white" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-ink">{t.auth.resetSentTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-positive">{t.auth.resetSent}</p>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">{t.auth.resetSentHint}</p>
        </div>
      ) : (
        <form action={requestPasswordReset} className="mt-8 space-y-4">
          {params.error && (
            <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
              {params.error === "captcha" ? t.auth.captchaRequired : t.auth.emailRateLimited}
            </p>
          )}
          <label className="block">
            <span className="text-sm font-semibold text-ink-soft">{t.auth.email}</span>
            <div className="mt-1">
              <ClearableInput type="email" name="email" required autoComplete="email" clearLabel={t.common.clearInput} />
            </div>
          </label>
          <CaptchaSubmit label={t.auth.sendResetLink} />
        </form>
      )}

      <div className="mt-6 border-t border-line pt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-primary hover:text-primary-strong">{t.auth.backToSignIn}</Link>
      </div>
    </div>
  );
}
