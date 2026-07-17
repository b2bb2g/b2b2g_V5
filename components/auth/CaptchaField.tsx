"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync, useFormStatus } from "react-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";

// Invisible-captcha submit button: pressing it runs hCaptcha in the
// background (a challenge pops only for suspicious traffic), then submits
// the surrounding form with the token attached. Falls back to a plain
// submit button when no site key is configured.
export function CaptchaSubmit({
  label,
  disabled = false,
  describedBy,
}: {
  label: string;
  disabled?: boolean;
  describedBy?: string;
}) {
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const captchaRef = useRef<HCaptcha>(null);
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  // hCaptcha tokens are single-use: once a submission round-trips (e.g. a
  // wrong-password error), the held token is spent. Reset the widget so the
  // next attempt verifies fresh instead of failing captcha forever.
  useEffect(() => {
    if (wasPending.current && !pending) {
      captchaRef.current?.resetCaptcha();
      setToken("");
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <>
      {siteKey && (
        <>
          <input type="hidden" name="captchaToken" value={token} />
          <HCaptcha
            ref={captchaRef}
            sitekey={siteKey}
            size="invisible"
            onVerify={setToken}
            onExpire={() => setToken("")}
            onError={() => {
              setToken("");
              setVerifying(false);
            }}
          />
        </>
      )}
      <button
        type="submit"
        disabled={disabled || verifying || pending}
        aria-busy={verifying || pending}
        aria-describedby={describedBy}
        onClick={async (event) => {
          if (!siteKey || token) return;
          const form = event.currentTarget.form;
          if (!form?.reportValidity()) return;
          event.preventDefault();
          setVerifying(true);
          try {
            const result = await captchaRef.current?.execute({ async: true });
            if (result?.response) {
              flushSync(() => setToken(result.response));
              form?.requestSubmit();
            }
          } catch {
            // Challenge dismissed: stay on the form.
          } finally {
            setVerifying(false);
          }
        }}
        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong disabled:opacity-60"
      >
        {verifying || pending ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" />
        ) : (
          label
        )}
      </button>
    </>
  );
}
