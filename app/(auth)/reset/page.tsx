import { getT } from "@/lib/i18n/server";
import { requestPasswordReset } from "@/app/actions/auth";
import { ClearableInput } from "@/components/ui/TextField";

export default async function ResetPage(props: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getT(), props.searchParams]);

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="text-xl font-extrabold">{t.auth.resetTitle}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.auth.resetBody}</p>

      {params.sent ? (
        <p className="mt-6 rounded-lg bg-positive-soft px-3 py-2 text-sm font-semibold text-positive">
          {t.auth.resetSent}
        </p>
      ) : (
        <form action={requestPasswordReset} className="mt-6 space-y-3">
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
          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong"
          >
            {t.common.submit}
          </button>
        </form>
      )}
    </div>
  );
}
