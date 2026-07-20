"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RELOCK_AFTER_MS,
  hashPin,
  isUnlockedThisSession,
  markLocked,
  markUnlocked,
  readAppLock,
  verifyBiometric,
  writeAppLock,
  type AppLockConfig,
} from "@/lib/app-lock";
import { signOut } from "@/app/actions/auth";
import { CodeField } from "@/components/security/CodeField";

type Labels = {
  title: string;
  subtitle: string;
  biometricCta: string;
  biometricHint: string;
  or: string;
  pinSectionLabel: string;
  pinPlaceholder: string;
  confirm: string;
  wrongPin: string;
  attemptsLeft: string;
  forgotPin: string;
  forgotPinHint: string;
  resetConfirm: string;
  showPin: string;
  hidePin: string;
};

const MAX_PIN_ATTEMPTS = 5;

// Full-screen unlock gate. Both paths are shown at once, on purpose: tapping
// the biometric button opens the OS prompt, while the 6-digit field accepts
// OUR app PIN directly. Keeping the PIN field on our own screen means a
// member who wants the PIN never enters the OS dialog (whose own "use PIN"
// is the DEVICE screen-lock PIN — a different thing that used to confuse
// everyone). No auto-firing of the OS prompt for the same reason.
export function AppLockGate({ labels }: { labels: Labels }) {
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"biometric" | "pin" | null>(null);
  const hiddenAt = useRef<number | null>(null);

  const engage = useCallback((current: AppLockConfig) => {
    markLocked();
    setConfig(current);
    setPin("");
    setError(null);
    setAttempts(0);
    setLocked(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = readAppLock();
      if (current && !isUnlockedThisSession()) engage(current);
    }, 0);
    // Background re-lock: a phone left on a desk should not stay open.
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current ? Date.now() - hiddenAt.current : 0;
      hiddenAt.current = null;
      const current = readAppLock();
      if (current && away > RELOCK_AFTER_MS) engage(current);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [engage]);

  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);

  const unlock = useCallback(() => {
    markUnlocked();
    setLocked(false);
    setPin("");
    setAttempts(0);
    setError(null);
  }, []);

  async function tryBiometric() {
    if (!config?.credentialId || busy) return;
    setBusy(true);
    setError(null);
    const ok = await verifyBiometric(config.credentialId);
    setBusy(false);
    if (ok) unlock();
    else setError("biometric");
  }

  async function submitPin() {
    if (!config || pin.length !== 6 || busy) return;
    setBusy(true);
    const ok = (await hashPin(pin, config.pinSalt)) === config.pinHash;
    setBusy(false);
    if (ok) {
      unlock();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setPin("");
    setError("pin");
    if (next >= MAX_PIN_ATTEMPTS) await resetLock();
  }

  // Forgot-PIN / lost-device recovery: clear the device lock and sign out.
  // Signing back in (password + email, still fully enforced) is the identity
  // proof; the member sets a fresh PIN afterward. A brand-new phone simply
  // has no lock and enrolls fresh.
  async function resetLock() {
    writeAppLock(null);
    markUnlocked();
    setLocked(false);
    await signOut();
  }

  if (!locked || !config) return null;

  const remaining = MAX_PIN_ATTEMPTS - attempts;
  const hasBiometric = !!config.credentialId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      className="fixed inset-0 z-[500] flex flex-col items-center overflow-y-auto bg-white px-6 py-12"
    >
      <div className="flex w-full max-w-xs flex-1 flex-col items-center justify-center">
        <Image
          src="/icons/b2bb2g-icon-192.png"
          alt=""
          width={64}
          height={64}
          priority
          className="h-16 w-16 rounded-[1.1rem] shadow-[0_14px_40px_rgba(27,100,218,.22)]"
        />
        <h1 className="mt-4 text-xl font-extrabold tracking-[-.02em]">
          {labels.title}
        </h1>
        <p className="mt-1 text-center text-sm leading-6 text-ink-soft">
          {labels.subtitle}
        </p>

        {hasBiometric && (
          <div className="mt-7 w-full">
            <button
              type="button"
              onClick={() => void tryBiometric()}
              disabled={busy}
              aria-busy={busy}
              className="btn-primary btn-lg w-full disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 11a4 4 0 0 1 4 4c0 2.5-.6 4.4-1.3 5.9M8.6 20.2A12 12 0 0 0 9.7 15a2.3 2.3 0 0 1 4.6 0c0 1.7-.2 3.3-.6 4.8M5.9 18A16 16 0 0 0 6.4 15a5.6 5.6 0 0 1 9-4.4M3.7 14.6A9 9 0 0 1 12 6a9 9 0 0 1 8.4 5.7" />
              </svg>
              {labels.biometricCta}
            </button>
            {error === "biometric" && (
              <p role="alert" className="mt-2 text-center text-xs font-bold text-negative">
                {labels.wrongPin}
              </p>
            )}
            <div className="mt-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs font-bold text-ink-faint">{labels.or}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </div>
        )}

        <form
          className={`w-full ${hasBiometric ? "mt-5" : "mt-7"}`}
          onSubmit={(event) => {
            event.preventDefault();
            void submitPin();
          }}
        >
          <label className="block">
            <span className="text-xs font-bold text-ink-soft">
              {labels.pinSectionLabel}
            </span>
            <div className="mt-1.5">
              <CodeField
                value={pin}
                onChange={(next) => {
                  setPin(next);
                  setError(null);
                }}
                secret
                autoFocus={!hasBiometric}
                placeholder={labels.pinPlaceholder}
                ariaLabel={labels.pinSectionLabel}
                showLabel={labels.showPin}
                hideLabel={labels.hidePin}
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={busy || pin.length !== 6}
            aria-busy={busy}
            className="btn-primary btn-lg mt-3 w-full disabled:opacity-50"
          >
            {labels.confirm}
          </button>
          {error === "pin" && (
            <p role="alert" className="mt-2 text-center text-xs font-bold text-negative">
              {labels.wrongPin} {labels.attemptsLeft.replace("{n}", String(remaining))}
            </p>
          )}
        </form>

        <div className="mt-9 text-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(labels.resetConfirm)) void resetLock();
            }}
            className="text-sm font-bold text-primary underline-offset-2 hover:underline"
          >
            {labels.forgotPin}
          </button>
          <p className="mt-1.5 max-w-xs text-[11px] leading-4 text-ink-faint">
            {labels.forgotPinHint}
          </p>
        </div>
      </div>
    </div>
  );
}
