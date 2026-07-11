import { getT } from "@/lib/i18n/server";
import { signIn } from "@/app/actions/auth";
import { ClearableInput, PasswordInput } from "@/components/ui/TextField";
import Link from "next/link";

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getT(), props.searchParams]);

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="text-xl font-extrabold">{t.auth.signInTitle}</h1>

      {params.error && (
        <p className="mt-3 rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {params.error === "link"
            ? t.auth.linkExpired
            : params.error === "restricted"
              ? t.auth.accountRestricted
              : t.auth.invalidCredentials}
        </p>
      )}

      <form action={signIn} className="mt-6 space-y-3">
        {params.next && <input type="hidden" name="next" value={params.next} />}
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">{t.auth.email}</span>
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
          <span className="text-xs font-semibold text-ink-soft">{t.auth.password}</span>
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
        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong"
        >
          {t.common.signIn}
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-sm">
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
