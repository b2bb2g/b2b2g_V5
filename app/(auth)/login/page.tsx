import { getT } from "@/lib/i18n/server";
import { signIn } from "@/app/actions/auth";
import { CaptchaSubmit } from "@/components/auth/CaptchaField";
import { ClearableInput, PasswordInput } from "@/components/ui/TextField";
import Link from "next/link";

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getT(), props.searchParams]);

  return (
    <div className="w-full">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.auth.welcomeBack}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{t.auth.signInTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.auth.signInSubtitle}</p>

      {params.error && (
        <p className="mt-3 rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {params.error === "link"
            ? t.auth.linkExpired
            : params.error === "restricted"
              ? t.auth.accountRestricted
              : params.error === "captcha"
                ? t.auth.captchaRequired
                : t.auth.invalidCredentials}
        </p>
      )}

      <form action={signIn} className="mt-8 space-y-4">
        {params.next && <input type="hidden" name="next" value={params.next} />}
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
              autoComplete="current-password"
              clearLabel={t.common.clearInput}
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
          </div>
        </label>
        <label className="flex items-center gap-2 py-1 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded accent-primary"
          />
          {t.auth.rememberMe}
        </label>
        <CaptchaSubmit label={t.common.signIn} />
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 border-t border-line pt-6 text-sm">
        <Link href="/reset" className="text-ink-faint hover:text-ink-soft">
          {t.auth.forgotPassword}
        </Link>
        <p className="text-ink-soft">
          {t.auth.noAccount}{" "}
          <Link href="/signup" className="font-semibold text-primary">
            {t.common.signUp}
          </Link>
        </p>
      </div>
    </div>
  );
}
