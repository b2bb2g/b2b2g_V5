"use client";

import { useEffect, useState } from "react";
import { CodeField } from "@/components/security/CodeField";
import {
  biometricAvailable,
  enrollBiometric,
  hashPin,
  newSalt,
  markUnlocked,
  readAppLock,
  verifyBiometric,
  writeAppLock,
} from "@/lib/app-lock";

type Labels = {
  title: string;
  description: string;
  biometricReady: string;
  biometricMissing: string;
  pinLabel: string;
  pinConfirmLabel: string;
  pinMismatch: string;
  enableWithBiometric: string;
  enablePinOnly: string;
  enabledBadge: string;
  enabledBiometric: string;
  enabledPinOnly: string;
  disable: string;
  verifyToDisable: string;
  error: string;
  showPin: string;
  hidePin: string;
};

// Settings card for the device app lock. Enrollment is two steps at most:
// confirm the biometric (when the device has one), then set the 6-digit
// fallback PIN that always exists as the alternative path.
export function AppLockPanel({ userLabel, labels }: { userLabel: string; labels: Labels }) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const config = readAppLock();
      const available = await biometricAvailable();
      if (cancelled) return;
      setEnabled(!!config);
      setHasBiometric(!!config?.credentialId);
      setCanBiometric(available);
      setReady(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  async function enable(withBiometric: boolean) {
    setNotice("");
    if (!/^\d{6}$/.test(pin)) return;
    if (pin !== pinConfirm) {
      setNotice(labels.pinMismatch);
      return;
    }
    setBusy(true);
    let credentialId: string | null = null;
    if (withBiometric) {
      credentialId = await enrollBiometric(userLabel);
      if (!credentialId) {
        setNotice(labels.error);
        setBusy(false);
        return;
      }
    }
    const salt = newSalt();
    writeAppLock({
      enabled: true,
      credentialId,
      pinHash: await hashPin(pin, salt),
      pinSalt: salt,
    });
    markUnlocked();
    setEnabled(true);
    setHasBiometric(!!credentialId);
    setPin("");
    setPinConfirm("");
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setNotice("");
    const config = readAppLock();
    let verified = false;
    if (config?.credentialId) {
      verified = await verifyBiometric(config.credentialId);
    }
    if (!verified && config) {
      const entered = window.prompt(labels.verifyToDisable) ?? "";
      verified =
        /^\d{6}$/.test(entered) &&
        (await hashPin(entered, config.pinSalt)) === config.pinHash;
    }
    if (!verified) {
      setNotice(labels.error);
      setBusy(false);
      return;
    }
    writeAppLock(null);
    setEnabled(false);
    setHasBiometric(false);
    setBusy(false);
  }

  if (!ready) return null;

  return (
    <section id="app-lock" className="scroll-mt-24 rounded-[1.5rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-[-.02em]">
            {labels.title}
          </h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">
            {labels.description}
          </p>
        </div>
        {enabled && (
          <span className="rounded-full bg-positive-soft px-3 py-1 text-xs font-extrabold text-positive">
            {labels.enabledBadge}
          </span>
        )}
      </div>

      {enabled ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-sub px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {hasBiometric ? labels.enabledBiometric : labels.enabledPinOnly}
          </span>
          <button
            type="button"
            onClick={disable}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-xs font-bold text-negative transition-colors hover:bg-negative-soft disabled:opacity-60"
          >
            {labels.disable}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p
            className={`flex items-center gap-2 text-xs font-bold ${canBiometric ? "text-positive" : "text-ink-faint"}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 11a4 4 0 0 1 4 4c0 2.5-.6 4.4-1.3 5.9M8.6 20.2A12 12 0 0 0 9.7 15a2.3 2.3 0 0 1 4.6 0c0 1.7-.2 3.3-.6 4.8M5.9 18A16 16 0 0 0 6.4 15a5.6 5.6 0 0 1 9-4.4M3.7 14.6A9 9 0 0 1 12 6a9 9 0 0 1 8.4 5.7" />
            </svg>
            {canBiometric ? labels.biometricReady : labels.biometricMissing}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-ink-soft">
                {labels.pinLabel}
              </span>
              <div className="mt-1">
                <CodeField
                  value={pin}
                  onChange={setPin}
                  secret
                  placeholder="000000"
                  ariaLabel={labels.pinLabel}
                  showLabel={labels.showPin}
                  hideLabel={labels.hidePin}
                  size="md"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-ink-soft">
                {labels.pinConfirmLabel}
              </span>
              <div className="mt-1">
                <CodeField
                  value={pinConfirm}
                  onChange={setPinConfirm}
                  secret
                  placeholder="000000"
                  ariaLabel={labels.pinConfirmLabel}
                  showLabel={labels.showPin}
                  hideLabel={labels.hidePin}
                  size="md"
                />
              </div>
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canBiometric && (
              <button
                type="button"
                onClick={() => void enable(true)}
                disabled={busy || pin.length !== 6 || pinConfirm.length !== 6}
                className="btn-primary btn-md disabled:opacity-50"
              >
                {labels.enableWithBiometric}
              </button>
            )}
            <button
              type="button"
              onClick={() => void enable(false)}
              disabled={busy || pin.length !== 6 || pinConfirm.length !== 6}
              className={`${canBiometric ? "btn-secondary" : "btn-primary"} btn-md disabled:opacity-50`}
            >
              {labels.enablePinOnly}
            </button>
          </div>
        </div>
      )}
      {notice && (
        <p role="alert" className="mt-3 text-xs font-bold text-negative">
          {notice}
        </p>
      )}
    </section>
  );
}
