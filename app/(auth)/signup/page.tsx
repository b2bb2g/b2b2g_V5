import { getT } from "@/lib/i18n/server";
import { signUp } from "@/app/actions/auth";
import { CaptchaSubmit } from "@/components/auth/CaptchaField";
import { ClearableInput, PasswordInput } from "@/components/ui/TextField";
import Link from "next/link";

export default async function SignUpPage(props: {
  searchParams: Promise<{ ref?: string; error?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getT(), props.searchParams]);

  return (
    <div className="w-full">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.auth.joinNetwork}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{t.auth.signUpTitle}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.auth.signUpSubtitle}</p>

      {params.ref && (
        <p className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-xs font-semibold text-primary-strong">
          {t.auth.referredBy}: {params.ref}
        </p>
      )}
      {params.error && (
        <p className="mt-3 rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {params.error === "captcha"
            ? t.auth.captchaRequired
            : params.error === "weak"
              ? t.auth.weakPassword
              : params.error === "rate"
                ? t.auth.emailRateLimited
                : t.common.error}
        </p>
      )}

      <form action={signUp} className="mt-8 space-y-4">
        {params.ref && <input type="hidden" name="ref" value={params.ref} />}
        <label className="block">
          <span className="text-sm font-semibold text-ink-soft">{t.auth.email}</span>
          <div className="mt-1">
            <ClearableInput
              type="email"
              name="email"
              required
              autoComplete="email"
              clearLabel={t.common.clearInput}
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-soft">{t.auth.password}</span>
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
        <CaptchaSubmit label={t.common.signUp} />
        <p className="text-center text-xs leading-relaxed text-ink-faint">{t.auth.termsHint}</p>
      </form>

      <p className="mt-6 border-t border-line pt-6 text-center text-sm text-ink-soft">
        {t.auth.alreadyHaveAccount}{" "}
        <Link href="/login" className="font-semibold text-primary">
          {t.common.signIn}
        </Link>
      </p>
    </div>
  );
}
