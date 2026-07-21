"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signUp } from "@/app/actions/auth";
import { CaptchaSubmit } from "@/components/auth/CaptchaField";
import { PasswordInput } from "@/components/ui/TextField";
import { passwordPolicyChecks } from "@/lib/password-policy";

type Labels = {
  email: string;
  password: string;
  checking: string;
  available: string;
  duplicate: string;
  invalid: string;
  required: string;
  mismatch: string;
  rate: string;
  rulesTitle: string;
  length: string;
  upper: string;
  lower: string;
  number: string;
  symbol: string;
  symbolHint: string;
  emailRule: string;
  clear: string;
  show: string;
  hide: string;
  submit: string;
  consentAll: string;
  consentRequired: string;
  consentOptional: string;
  consentTerms: string;
  consentPrivacy: string;
  consentCookies: string;
  consentMarketing: string;
  consentView: string;
  consentNeeded: string;
  finishEmail: string;
  finishPassword: string;
  ready: string;
  signIn: string;
  already: string;
  resetPassword: string;
};

type EmailState = "idle" | "checking" | "available" | "invalid" | "duplicate" | "invite_required" | "email_mismatch" | "rate_limited" | "unavailable";

function ConsentCheck({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
        checked
          ? "border-primary bg-primary text-white"
          : "border-line bg-white text-transparent"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

export function SignupForm({ invite, labels }: { invite?: string; labels: Labels }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [consent, setConsent] = useState({
    terms: false,
    privacy: false,
    cookies: false,
    marketing: false,
  });
  const requiredConsent = consent.terms && consent.privacy && consent.cookies;
  const allConsent = requiredConsent && consent.marketing;
  const toggleAll = () => {
    const next = !allConsent;
    setConsent({
      terms: next,
      privacy: next,
      cookies: next,
      marketing: next,
    });
  };
  const toggleConsent = (key: keyof typeof consent) =>
    setConsent((current) => ({ ...current, [key]: !current[key] }));
  const consentItems = [
    { key: "terms", required: true, label: labels.consentTerms, href: "/legal/terms" },
    { key: "privacy", required: true, label: labels.consentPrivacy, href: "/legal/privacy" },
    { key: "cookies", required: true, label: labels.consentCookies, href: "/legal/cookies" },
    { key: "marketing", required: false, label: labels.consentMarketing, href: null },
  ] as const;
  const checks = useMemo(() => passwordPolicyChecks(password, email), [password, email]);
  const passwordValid = Object.values(checks).every(Boolean);
  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailHasError = [
    "duplicate",
    "invalid",
    "invite_required",
    "email_mismatch",
    "rate_limited",
    "unavailable",
  ].includes(emailState);

  useEffect(() => {
    if (!email || !emailFormatValid) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setEmailState("checking");
      try {
        const response = await fetch("/api/auth/email-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, invite }),
          signal: controller.signal,
        });
        const result = (await response.json()) as { state?: EmailState };
        setEmailState(result.state ?? "unavailable");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setEmailState("unavailable");
      }
    }, 600);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [email, emailFormatValid, invite]);

  const messages: Partial<Record<EmailState, string>> = {
    checking: labels.checking,
    available: labels.available,
    duplicate: labels.duplicate,
    invalid: labels.invalid,
    invite_required: labels.required,
    email_mismatch: labels.mismatch,
    rate_limited: labels.rate,
    unavailable: labels.rate,
  };
  const ready = emailState === "available" && passwordValid && requiredConsent;
  const readinessMessage =
    emailState !== "available"
      ? labels.finishEmail
      : !passwordValid
        ? labels.finishPassword
        : !requiredConsent
          ? labels.consentNeeded
          : labels.ready;

  return (
    <form action={signUp} className="mt-8 space-y-4">
      {invite && <input type="hidden" name="invite" value={invite} />}
      <label className="block">
        <span className="text-sm font-semibold text-ink-soft">{labels.email}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => {
            const value = event.target.value;
            setEmail(value);
            setEmailState(
              !value
                ? "idle"
                : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                  ? "checking"
                  : "invalid",
            );
          }}
          aria-describedby="email-availability"
          aria-invalid={emailHasError}
          className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-4 ${
            emailState === "available"
              ? "border-positive focus:border-positive focus-visible:ring-positive/10"
              : emailHasError
                ? "border-negative focus:border-negative focus-visible:ring-negative/10"
                : "border-line focus:border-primary focus-visible:ring-primary/10"
          }`}
        />
        <p
          id="email-availability"
          aria-live="polite"
          className={`mt-1.5 min-h-4 text-xs font-semibold ${emailState === "available" ? "text-positive" : emailState === "idle" || emailState === "checking" ? "text-ink-faint" : "text-negative"}`}
        >
          {emailState === "available" && <span aria-hidden="true">✓ </span>}
          {emailHasError && <span aria-hidden="true">! </span>}
          {messages[emailState] ?? ""}
          {emailState === "duplicate" && (
            <> <Link href="/reset" className="underline">{labels.resetPassword}</Link></>
          )}
        </p>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink-soft">{labels.password}</span>
        <div className="mt-1">
          <PasswordInput
            name="password"
            required
            minLength={10}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
            onClear={() => setPassword("")}
            aria-describedby="password-rules signup-readiness"
            aria-invalid={password.length > 0 && !passwordValid}
            clearLabel={labels.clear}
            showLabel={labels.show}
            hideLabel={labels.hide}
          />
        </div>
      </label>
      <fieldset id="password-rules" className="rounded-xl bg-surface-sub px-4 py-3">
        <legend className="px-1 text-xs font-extrabold text-ink-soft">{labels.rulesTitle}</legend>
        <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {([
            ["length", labels.length], ["upper", labels.upper], ["lower", labels.lower],
            ["number", labels.number], ["symbol", labels.symbol], ["email", labels.emailRule],
          ] as const).map(([key, label]) => (
            <li key={key} className={`text-xs font-semibold ${checks[key] ? "text-positive" : "text-ink-faint"}`}>
              <span aria-hidden="true">{checks[key] ? "✓" : "○"}</span> {label}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs leading-5 text-ink-faint">{labels.symbolHint}</p>
      </fieldset>

      <div className="overflow-hidden rounded-xl border border-line">
        <input type="hidden" name="agree_terms" value={consent.terms ? "1" : "0"} />
        <input type="hidden" name="agree_privacy" value={consent.privacy ? "1" : "0"} />
        <input type="hidden" name="agree_cookies" value={consent.cookies ? "1" : "0"} />
        <input type="hidden" name="marketing_consent" value={consent.marketing ? "1" : "0"} />
        <button
          type="button"
          role="checkbox"
          aria-checked={allConsent}
          onClick={toggleAll}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface-sub"
        >
          <ConsentCheck checked={allConsent} />
          <span className="text-sm font-bold text-ink">{labels.consentAll}</span>
        </button>
        <div className="space-y-1 border-t border-line px-2 py-2">
          {consentItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-1 rounded-lg pr-1 hover:bg-surface-sub"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={consent[item.key]}
                onClick={() => toggleConsent(item.key)}
                className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-1.5 text-left"
              >
                <ConsentCheck checked={consent[item.key]} />
                <span className="min-w-0 text-xs text-ink-soft">
                  <span
                    className={`font-bold ${item.required ? "text-primary" : "text-ink-faint"}`}
                  >
                    [{item.required ? labels.consentRequired : labels.consentOptional}]
                  </span>{" "}
                  {item.label}
                </span>
              </button>
              {item.href && (
                <Link
                  href={item.href}
                  target="_blank"
                  className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-ink-faint underline underline-offset-2 transition-colors hover:text-primary"
                >
                  {labels.consentView}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <p
        id="signup-readiness"
        aria-live="polite"
        className={`flex items-center gap-1.5 text-xs font-semibold ${ready ? "text-positive" : "text-ink-faint"}`}
      >
        <span aria-hidden="true">{ready ? "✓" : "○"}</span>
        {readinessMessage}
      </p>
      <CaptchaSubmit label={labels.submit} disabled={!ready} describedBy="signup-readiness" />
      <p className="border-t border-line pt-6 text-center text-sm text-ink-soft">
        {labels.already} <Link href="/login" className="font-semibold text-primary">{labels.signIn}</Link>
      </p>
    </form>
  );
}
