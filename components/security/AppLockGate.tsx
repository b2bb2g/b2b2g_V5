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

type Labels = {
  title: string;
  subtitle: string;
  unlockBiometric: string;
  usePin: string;
  pinPlaceholder: string;
  confirm: string;
  wrongPin: string;
  attemptsLeft: string;
  emergency: string;
  emergencyHint: string;
};

const MAX_PIN_ATTEMPTS = 5;

// Full-screen unlock gate. Appears when the device lock is enabled and this
// browser session has not been unlocked yet (or the app sat in the
// background past the re-lock window). Biometric fires first; the PIN is
// always one tap away; the emergency path signs out AND clears the lock so
// nobody is ever stranded on their own device.
export function AppLockGate({ labels }: { labels: Labels }) {
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [locked, setLocked] = useState(false);
  const [mode, setMode] = useState<"biometric" | "pin">("biometric");
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const hiddenAt = useRef<number | null>(null);
  const biometricTried = useRef(false);

  const engage = useCallback((current: AppLockConfig) => {
    markLocked();
    setConfig(current);
    setMode(current.credentialId ? "biometric" : "pin");
    setPin("");
    setError(false);
    biometricTried.current = false;
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

  const unlock = useCallback(() => {
    markUnlocked();
    setLocked(false);
    setPin("");
    setAttempts(0);
  }, []);

  const tryBiometric = useCallback(async () => {
    if (!config?.credentialId || busy) return;
    setBusy(true);
    setError(false);
    const ok = await verifyBiometric(config.credentialId);
    setBusy(false);
    if (ok) unlock();
    else setError(true);
  }, [config, busy, unlock]);

  // Biometric prompts need no extra tap on open.
  useEffect(() => {
    if (!locked || mode !== "biometric" || biometricTried.current) return;
    biometricTried.current = true;
    const timer = setTimeout(() => void tryBiometric(), 350);
    return () => clearTimeout(timer);
  }, [locked, mode, tryBiometric]);

  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);

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
    setError(true);
    if (next >= MAX_PIN_ATTEMPTS) await emergencyExit();
  }

  async function emergencyExit() {
    writeAppLock(null);
    markUnlocked();
    setLocked(false);
    await signOut();
  }

  if (!locked || !config) return null;

  const remaining = MAX_PIN_ATTEMPTS - attempts;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-white px-6"
    >
      <Image
        src="/icons/b2bb2g-icon-192.png"
        alt=""
        width={72}
        height={72}
        priority
        className="h-18 w-18 rounded-[1.2rem] shadow-[0_14px_40px_rgba(27,100,218,.22)]"
      />
      <h1 className="mt-5 text-xl font-extrabold tracking-[-.02em]">
        {labels.title}
      </h1>
      <p className="mt-1 max-w-xs text-center text-sm leading-6 text-ink-soft">
        {labels.subtitle}
      </p>

      {mode === "biometric" ? (
        <div className="mt-7 flex w-full max-w-xs flex-col items-center gap-3">
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
            {labels.unlockBiometric}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("pin");
              setError(false);
            }}
            className="text-sm font-bold text-primary hover:text-primary-strong"
          >
            {labels.usePin}
          </button>
        </div>
      ) : (
        <form
          className="mt-7 flex w-full max-w-xs flex-col items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPin();
          }}
        >
          <label className="w-full">
            <span className="sr-only">{labels.pinPlaceholder}</span>
            <input
              autoFocus
              value={pin}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 6);
                setPin(next);
                setError(false);
              }}
              inputMode="numeric"
              type="password"
              autoComplete="off"
              placeholder={labels.pinPlaceholder}
              className="field text-center text-2xl font-extrabold tracking-[.45em]"
            />
          </label>
          <button
            type="submit"
            disabled={busy || pin.length !== 6}
            aria-busy={busy}
            className="btn-primary btn-lg w-full disabled:opacity-50"
          >
            {labels.confirm}
          </button>
          {config.credentialId && (
            <button
              type="button"
              onClick={() => {
                setMode("biometric");
                setError(false);
                void tryBiometric();
              }}
              className="text-sm font-bold text-primary hover:text-primary-strong"
            >
              {labels.unlockBiometric}
            </button>
          )}
        </form>
      )}

      {error && (
        <p role="alert" className="mt-4 text-xs font-bold text-negative">
          {mode === "pin"
            ? `${labels.wrongPin} ${labels.attemptsLeft.replace("{n}", String(remaining))}`
            : labels.wrongPin}
        </p>
      )}

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={() => void emergencyExit()}
          className="text-xs font-bold text-ink-faint underline-offset-2 hover:text-ink hover:underline"
        >
          {labels.emergency}
        </button>
        <p className="mt-1 max-w-xs text-[11px] leading-4 text-ink-faint">
          {labels.emergencyHint}
        </p>
      </div>
    </div>
  );
}
