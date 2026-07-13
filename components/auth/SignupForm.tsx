"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signUp } from "@/app/actions/auth";
import { CaptchaSubmit } from "@/components/auth/CaptchaField";
import { PasswordInput } from "@/components/ui/TextField";
import {
  passwordPolicyChecks,
  SUPABASE_PASSWORD_SYMBOLS,
} from "@/lib/password-policy";

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
  terms: string;
  signIn: string;
  already: string;
  resetPassword: string;
};

type EmailState = "idle" | "checking" | "available" | "duplicate" | "invalid" | "invite_required" | "email_mismatch" | "rate_limited" | "unavailable";

export function SignupForm({ invite, labels }: { invite?: string; labels: Labels }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const checks = useMemo(() => passwordPolicyChecks(password, email), [password, email]);
  const passwordValid = Object.values(checks).every(Boolean);
  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
  const ready = emailState === "available" && passwordValid;

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
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <p
          id="email-availability"
          aria-live="polite"
          className={`mt-1.5 min-h-4 text-xs font-semibold ${emailState === "available" ? "text-positive" : emailState === "idle" || emailState === "checking" ? "text-ink-faint" : "text-negative"}`}
        >
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
            clearLabel={labels.clear}
            showLabel={labels.show}
            hideLabel={labels.hide}
          />
        </div>
      </label>
      <fieldset className="rounded-xl bg-surface-sub px-4 py-3">
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
        <p className="mt-2 break-words text-[11px] leading-5 text-ink-faint">
          {labels.symbolHint}: {" "}
          <code className="font-mono text-ink-soft">{SUPABASE_PASSWORD_SYMBOLS}</code>
        </p>
      </fieldset>

      <CaptchaSubmit label={labels.submit} disabled={!ready} />
      <p className="text-center text-xs leading-relaxed text-ink-faint">{labels.terms}</p>
      <p className="border-t border-line pt-6 text-center text-sm text-ink-soft">
        {labels.already} <Link href="/login" className="font-semibold text-primary">{labels.signIn}</Link>
      </p>
    </form>
  );
}
