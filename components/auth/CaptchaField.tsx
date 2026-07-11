"use client";

import { useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

// hCaptcha widget for auth forms. Renders only when a site key is
// configured; the verified token travels with the form and is forwarded to
// Supabase (which enforces it once captcha protection is switched on).
export function CaptchaField() {
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const [token, setToken] = useState("");

  if (!siteKey) return null;

  return (
    <div className="flex justify-center py-1">
      <input type="hidden" name="captchaToken" value={token} />
      <HCaptcha
        sitekey={siteKey}
        onVerify={setToken}
        onExpire={() => setToken("")}
      />
    </div>
  );
}
