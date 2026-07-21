"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { confirmMfaReset, requestMfaReset } from "@/app/actions/mfa-reset";
import { CodeField } from "@/components/security/CodeField";

type Factor = { id: string; status: string; friendly_name?: string };
type Enrollment = { id: string; totp: { qr_code: string; secret: string } };

function normalizeQrCodeSource(source: string) {
  const trimmed = source.trim();
  const svgPrefix = "data:image/svg+xml;utf-8,";

  if (!trimmed.startsWith(svgPrefix)) return trimmed;

  const svg = trimmed.slice(svgPrefix.length);
  return svg.trimStart().startsWith("<")
    ? `${svgPrefix}${encodeURIComponent(svg)}`
    : trimmed;
}

type Labels = {
  title: string;
  description: string;
  adminRequired: string;
  challengeTitle: string;
  challengeDescription: string;
  continue: string;
  enabled: string;
  enroll: string;
  scan: string;
  code: string;
  verify: string;
  remove: string;
  error: string;
  showPassword: string;
  hidePassword: string;
  lostDevice: string;
  resetHint: string;
  sendResetCode: string;
  resetCodeSent: string;
  resetThrottled: string;
  confirmReset: string;
  resetDone: string;
  resetConfirmBody: string;
  resetConfirmSend: string;
  cancel: string;
};

export function MfaPanel({
  isAdmin,
  required = false,
  returnTo = "/dashboard/security",
  initialFactor = null,
  initialAal = null,
  labels,
}: {
  isAdmin: boolean;
  required?: boolean;
  returnTo?: string;
  initialFactor?: Factor | null;
  initialAal?: string | null;
  labels: Labels;
}) {
  const [factor, setFactor] = useState<Factor | null>(initialFactor);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [aal, setAal] = useState<string | null>(initialAal);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Lost-authenticator recovery: idle -> confirm -> email code sent -> removed.
  const [reset, setReset] = useState<"idle" | "confirm" | "sent" | "done">(
    "idle",
  );
  const [resetCode, setResetCode] = useState("");
  const [resetNotice, setResetNotice] = useState("");

  async function startReset() {
    setBusy(true);
    setResetNotice("");
    const result = await requestMfaReset();
    if (result.ok) {
      setReset("sent");
      setResetNotice(labels.resetCodeSent);
    } else {
      setResetNotice(
        result.reason === "throttled" ? labels.resetThrottled : labels.error,
      );
    }
    setBusy(false);
  }

  async function finishReset() {
    if (!/^\d{6}$/.test(resetCode)) return;
    setBusy(true);
    const result = await confirmMfaReset(resetCode);
    if (result.ok) {
      setReset("done");
      setResetNotice(labels.resetDone);
      setResetCode("");
      setFactor(null);
      setEnrollment(null);
      await refresh();
    } else {
      setResetNotice(labels.error);
    }
    setBusy(false);
  }

  async function refresh() {
    const supabase = createClient();
    const [factorsResult, levelResult] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    const verifiedFactor = (factorsResult.data?.totp?.find((item) => item.status === "verified") ?? null) as Factor | null;
    const currentAal = levelResult.data?.currentLevel ?? null;
    setFactor(verifiedFactor);
    setAal(currentAal);
  }

  async function enroll() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data: existing } = await supabase.auth.mfa.listFactors();
    await Promise.all(
      (existing?.all ?? [])
        .filter((item) => item.factor_type === "totp" && item.status !== "verified")
        .map((item) => supabase.auth.mfa.unenroll({ factorId: item.id })),
    );
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "B2BB2G authenticator",
    });
    if (enrollError || !data?.totp) setError(labels.error);
    else setEnrollment(data as Enrollment);
    setBusy(false);
  }

  async function verify(value = code) {
    const factorId = enrollment?.id ?? factor?.id;
    if (!factorId || !/^\d{6}$/.test(value)) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: value,
    });
    if (verifyError) {
      setError(labels.error);
      setBusy(false);
      return;
    }
    setEnrollment(null);
    setCode("");
    await refresh();
    if (required) {
      window.location.replace(returnTo);
      return;
    }
    setBusy(false);
    window.location.reload();
  }

  async function remove() {
    if (!factor) return;
    setBusy(true);
    const supabase = createClient();
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (removeError) setError(labels.error);
    else await refresh();
    setBusy(false);
  }

  const needsCode = Boolean(enrollment || (factor && aal !== "aal2"));
  const isChallenge = Boolean(factor && aal !== "aal2");
  return (
    <section
      id="mfa-verification"
      className={`rounded-[1.5rem] border bg-white p-5 shadow-(--shadow-card) sm:p-7 ${required ? "border-primary/35 ring-4 ring-primary/10" : "border-line"}`}
    >
      <h3 className="text-lg font-extrabold tracking-[-.02em]">
        {isChallenge ? labels.challengeTitle : labels.title}
      </h3>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">
        {isChallenge
          ? labels.challengeDescription
          : isAdmin
            ? labels.adminRequired
            : labels.description}
      </p>

      {factor && aal === "aal2" ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-positive-soft px-4 py-3">
          <span className="text-sm font-bold text-positive">{labels.enabled}</span>
          {required ? (
            <Link href={returnTo} className="btn-primary btn-sm">
              {labels.continue}
            </Link>
          ) : !isAdmin ? (
            <button type="button" onClick={remove} disabled={busy} className="rounded-lg px-3 py-2 text-xs font-bold text-negative hover:bg-negative-soft disabled:opacity-60">{labels.remove}</button>
          ) : null}
        </div>
      ) : !enrollment && !factor ? (
        <button type="button" onClick={enroll} disabled={busy} className="btn-primary btn-md mt-4 disabled:opacity-60">{labels.enroll}</button>
      ) : null}

      {enrollment && (
        <div className="mt-4 rounded-2xl border border-line bg-surface-sub p-4">
          <p className="text-sm font-bold">{labels.scan}</p>
          <Image
            src={normalizeQrCodeSource(enrollment.totp.qr_code)}
            alt={labels.scan}
            width={180}
            height={180}
            unoptimized
            className="mt-3 rounded-xl bg-white p-2"
          />
          <p className="mt-2 break-all font-mono text-[11px] text-ink-faint">{enrollment.totp.secret}</p>
        </div>
      )}
      {needsCode && (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void verify();
          }}
        >
          <div className="min-w-0 flex-1">
            <CodeField
              value={code}
              onChange={setCode}
              onComplete={(next) => {
                if (!busy) void verify(next);
              }}
              autoFocus={required}
              ariaLabel={labels.code}
              showLabel={labels.showPassword}
              hideLabel={labels.hidePassword}
              size={required ? "lg" : "md"}
            />
          </div>
          <button type="submit" disabled={busy || code.length !== 6} aria-busy={busy} className="btn-primary btn-md disabled:opacity-60">
            {busy ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" aria-hidden="true" />
            ) : (
              labels.verify
            )}
          </button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-xs font-bold text-negative">{error}</p>}

      {/* Lost-device recovery: available whenever a verified factor blocks
          the member (challenge) or they simply cannot open their app. */}
      {factor && reset !== "done" && (
        <div className="mt-5 border-t border-line pt-4">
          {reset === "idle" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setResetNotice("");
                  setReset("confirm");
                }}
                disabled={busy}
                className="text-sm font-bold text-primary hover:text-primary-strong disabled:opacity-60"
              >
                {labels.lostDevice}
              </button>
              <p className="mt-1 text-xs leading-5 text-ink-faint">
                {labels.resetHint}
              </p>
            </>
          ) : reset === "confirm" ? (
            <div className="rounded-xl border border-line bg-surface-sub/50 p-3.5">
              <p className="text-sm font-bold">{labels.lostDevice}</p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">
                {labels.resetConfirmBody}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReset("idle")}
                  disabled={busy}
                  className="btn-secondary btn-sm disabled:opacity-60"
                >
                  {labels.cancel}
                </button>
                <button
                  type="button"
                  onClick={startReset}
                  disabled={busy}
                  aria-busy={busy}
                  className="btn-primary btn-sm disabled:opacity-60"
                >
                  {busy ? (
                    <span
                      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-middle"
                      aria-hidden="true"
                    />
                  ) : (
                    labels.resetConfirmSend
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void finishReset();
              }}
            >
              <div className="min-w-0 flex-1">
                <CodeField
                  value={resetCode}
                  onChange={setResetCode}
                  ariaLabel={labels.code}
                  showLabel={labels.showPassword}
                  hideLabel={labels.hidePassword}
                  size="md"
                />
              </div>
              <button
                type="submit"
                disabled={busy || resetCode.length !== 6}
                aria-busy={busy}
                className="btn-secondary btn-md disabled:opacity-60"
              >
                {labels.confirmReset}
              </button>
            </form>
          )}
        </div>
      )}
      {resetNotice && (
        <p
          role="status"
          className={`mt-3 text-xs font-bold ${reset === "done" ? "text-positive" : "text-ink-soft"}`}
        >
          {resetNotice}
        </p>
      )}
    </section>
  );
}
