import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createCaptchaBypassFetch } from "@/lib/supabase/captcha-fetch";

export async function createAuthClient(sessionOnly?: boolean) {
  const client = await createClient({ sessionOnly });
  // Read on every submission so a stale page cannot override the admin policy.
  const { data, error } = await client.from("site_settings")
    .select("value").eq("key", "auth_captcha_enabled").maybeSingle();
  if (error) throw error;
  const captchaEnabled = data?.value === true;
  if (captchaEnabled) return { supabase: client, captchaEnabled };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required when auth CAPTCHA is disabled");
  const supabase = await createClient({
    sessionOnly,
    authFetch: createCaptchaBypassFetch(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey),
  });
  return { supabase, captchaEnabled };
}
