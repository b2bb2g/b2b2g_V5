import { getT } from "@/lib/i18n/server";
import { resendVerification } from "@/app/actions/auth";
import { PendingButton } from "@/components/ui/PendingButton";

export default async function VerifyPage(props: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { t } = await getT();
  const params = await props.searchParams;
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-strong" aria-hidden="true">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-extrabold">{t.auth.verifyTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.auth.verifyBody}</p>
      {params.sent && <p role="status" className="mt-4 rounded-xl bg-positive-soft px-3 py-2 text-xs font-bold text-positive">{t.auth.signUpDone}</p>}
      {params.error && <p role="alert" className="mt-4 rounded-xl bg-negative-soft px-3 py-2 text-xs font-bold text-negative">{t.auth.emailRateLimited}</p>}
      <p className="mt-5 text-xs leading-5 text-ink-faint">{t.auth.resetSentHint}</p>
      <form action={resendVerification} className="mt-4">
        <PendingButton className="btn-secondary btn-md w-full">{t.auth.resend}</PendingButton>
      </form>
    </div>
  );
}
