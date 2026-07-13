"use client";

import { useMemo, useState } from "react";
import { updatePassword } from "@/app/actions/auth";
import { PasswordInput } from "@/components/ui/TextField";
import { PendingButton } from "@/components/ui/PendingButton";
import {
  passwordPolicyChecks,
  SUPABASE_PASSWORD_SYMBOLS,
} from "@/lib/password-policy";

type Labels = {
  password: string;
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
};

export function PasswordPolicyForm({ email, labels }: { email: string; labels: Labels }) {
  const [password, setPassword] = useState("");
  const checks = useMemo(() => passwordPolicyChecks(password, email), [password, email]);
  const valid = Object.values(checks).every(Boolean);
  return (
    <form action={updatePassword} className="mt-8 space-y-4">
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
          {([["length", labels.length], ["upper", labels.upper], ["lower", labels.lower], ["number", labels.number], ["symbol", labels.symbol], ["email", labels.emailRule]] as const).map(([key, label]) => (
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
      <PendingButton disabled={!valid} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong disabled:opacity-60">
        {labels.submit}
      </PendingButton>
    </form>
  );
}
