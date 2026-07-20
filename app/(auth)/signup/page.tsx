import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingString } from "@/lib/data/settings";
import { SETTING_KEYS } from "@/lib/constants";
import { SignupForm } from "@/components/auth/SignupForm";

function Gate({ title, body, signIn, home }: { title: string; body: string; signIn: string; home: string }) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="8" /></svg>
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-soft">{body}</p>
      <div className="mt-7 flex justify-center gap-2">
        <Link href="/login" className="btn-primary btn-md">{signIn}</Link>
        <Link href="/" className="btn-secondary btn-md">{home}</Link>
      </div>
    </div>
  );
}

export default async function SignUpPage(props: {
  searchParams: Promise<{ invite?: string; error?: string }>;
}) {
  const [{ t }, params, settings, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    getPublicSettings(),
    createClient(),
  ]);
  const mode = settingString(settings, SETTING_KEYS.SIGNUP_MODE, "open");
  const invite = params.invite?.slice(0, 256);

  let inviteState: string | null = null;
  if (invite) {
    const { data } = await supabase.rpc("validate_referral_invitation", {
      p_token: invite,
      p_email: null,
    });
    inviteState = data?.[0]?.state ?? "invalid";
  }

  if (mode === "paused") {
    return <Gate title={t.auth.signupPaused} body={t.auth.signupPaused} signIn={t.common.signIn} home={t.auth.backHome} />;
  }
  if (invite && inviteState !== "active") {
    return <Gate title={t.auth.invitationInvalid} body={t.auth.invitationInvalid} signIn={t.common.signIn} home={t.auth.backHome} />;
  }
  if (mode === "invite_only" && !invite) {
    return <Gate title={t.auth.invitationRequired} body={t.auth.invitationRequired} signIn={t.common.signIn} home={t.auth.backHome} />;
  }

  return (
    <div className="w-full">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.auth.joinNetwork}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{t.auth.signUpTitle}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.auth.signUpSubtitle}</p>

      {invite && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary-soft/70 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-extrabold text-primary-strong">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {t.auth.invitationConfirmed}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-primary-strong/85">
            {t.auth.invitationOneUseNote}
          </p>
        </div>
      )}
      {params.error && (
        <p role="alert" className="mt-3 rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {params.error === "captcha"
            ? t.auth.captchaRequired
            : params.error === "weak"
              ? t.auth.weakPassword
              : params.error === "duplicate"
                ? t.auth.emailDuplicate
                : params.error === "invite"
                  ? t.auth.invitationInvalid
                  : params.error === "rate"
                    ? t.auth.emailRateLimited
                    : t.common.error}
        </p>
      )}

      <SignupForm
        invite={invite}
        labels={{
          email: t.auth.email,
          password: t.auth.password,
          checking: t.auth.emailChecking,
          available: t.auth.emailAvailable,
          duplicate: t.auth.emailDuplicate,
          invalid: t.auth.emailInvalid,
          required: t.auth.invitationRequired,
          mismatch: t.auth.invitationEmailMismatch,
          rate: t.auth.emailRateLimited,
          rulesTitle: t.auth.passwordRulesTitle,
          length: t.auth.passwordLengthRule,
          upper: t.auth.passwordUpperRule,
          lower: t.auth.passwordLowerRule,
          number: t.auth.passwordNumberRule,
          symbol: t.auth.passwordSymbolRule,
          symbolHint: t.auth.passwordSymbolHint,
          emailRule: t.auth.passwordEmailRule,
          clear: t.common.clearInput,
          show: t.auth.showPassword,
          hide: t.auth.hidePassword,
          submit: t.common.signUp,
          termsPrefix: t.auth.termsPrefix,
          termsJoin: t.auth.termsJoin,
          termsSuffix: t.auth.termsSuffix,
          termsLabel: t.footer.terms,
          privacyLabel: t.footer.privacy,
          finishEmail: t.auth.signupFinishEmail,
          finishPassword: t.auth.signupFinishPassword,
          ready: t.auth.signupReady,
          signIn: t.common.signIn,
          already: t.auth.alreadyHaveAccount,
          resetPassword: t.auth.forgotPassword,
        }}
      />
    </div>
  );
}
