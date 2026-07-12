"use client";

import { useRef, useState } from "react";
import { flushSync, useFormStatus } from "react-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";

// Invisible-captcha submit button: pressing it runs hCaptcha in the
// background (a challenge pops only for suspicious traffic), then submits
// the surrounding form with the token attached. Falls back to a plain
// submit button when no site key is configured.
export function CaptchaSubmit({ label, disabled = false }: { label: string; disabled?: boolean }) {
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const captchaRef = useRef<HCaptcha>(null);
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { pending } = useFormStatus();

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
          />
        </>
      )}
      <button
        type="submit"
        disabled={disabled || verifying || pending}
        aria-busy={verifying || pending}
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
