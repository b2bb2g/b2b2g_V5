"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; status: string; friendly_name?: string };
type Enrollment = { id: string; totp: { qr_code: string; secret: string } };

type Labels = {
  title: string;
  description: string;
  adminRequired: string;
  enabled: string;
  enroll: string;
  scan: string;
  code: string;
  verify: string;
  remove: string;
  error: string;
};

export function MfaPanel({ isAdmin, labels }: { isAdmin: boolean; labels: Labels }) {
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [aal, setAal] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const supabase = createClient();
    const [{ data: factors }, { data: level }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    setFactor((factors?.totp?.find((item) => item.status === "verified") ?? null) as Factor | null);
    setAal(level?.currentLevel ?? null);
  }

  useEffect(() => {
    const supabase = createClient();
    void Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]).then(([factorsResult, levelResult]) => {
      setFactor((factorsResult.data?.totp?.find((item) => item.status === "verified") ?? null) as Factor | null);
      setAal(levelResult.data?.currentLevel ?? null);
    });
  }, []);

  async function enroll() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data: existing } = await supabase.auth.mfa.listFactors();
    await Promise.all(
      (existing?.totp ?? [])
        .filter((item) => item.status !== "verified")
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

  async function verify() {
    const factorId = enrollment?.id ?? factor?.id;
    if (!factorId || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    if (verifyError) {
      setError(labels.error);
      setBusy(false);
      return;
    }
    setEnrollment(null);
    setCode("");
    await refresh();
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
  return (
    <section className="rounded-[1.5rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-7">
      <h3 className="text-base font-extrabold">{labels.title}</h3>
      <p className="mt-1 text-xs leading-5 text-ink-faint">{isAdmin ? labels.adminRequired : labels.description}</p>
      {factor && aal === "aal2" ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-positive-soft px-4 py-3">
          <span className="text-sm font-bold text-positive">{labels.enabled}</span>
          <button type="button" onClick={remove} disabled={busy} className="rounded-lg px-3 py-2 text-xs font-bold text-negative hover:bg-negative-soft disabled:opacity-60">{labels.remove}</button>
        </div>
      ) : !enrollment && !factor ? (
        <button type="button" onClick={enroll} disabled={busy} className="btn-primary btn-md mt-4 disabled:opacity-60">{labels.enroll}</button>
      ) : null}

      {enrollment && (
        <div className="mt-4 rounded-2xl border border-line bg-surface-sub p-4">
          <p className="text-sm font-bold">{labels.scan}</p>
          <Image src={enrollment.totp.qr_code} alt={labels.scan} width={180} height={180} unoptimized className="mt-3 rounded-xl bg-white p-2" />
          <p className="mt-2 break-all font-mono text-[11px] text-ink-faint">{enrollment.totp.secret}</p>
        </div>
      )}
      {needsCode && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{labels.code}</span>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder={labels.code} className="w-full rounded-xl border border-line px-3 py-2.5 text-sm tracking-[.25em] outline-none focus:border-primary" />
          </label>
          <button type="button" onClick={verify} disabled={busy || code.length !== 6} className="btn-primary btn-md disabled:opacity-60">{labels.verify}</button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs font-bold text-negative">{error}</p>}
    </section>
  );
}
