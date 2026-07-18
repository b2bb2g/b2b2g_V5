import { createClient } from "@supabase/supabase-js";

// Best-effort error persistence (service role only; silently skipped when
// unconfigured). Never throws: logging must not break the request.
export async function persistErrorLog(entry: {
  source: "server" | "client";
  message: string;
  stack?: string | null;
  url?: string | null;
  userAgent?: string | null;
}) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return;
  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await supabase.from("app_error_logs").insert({
      source: entry.source,
      message: entry.message.slice(0, 500),
      stack: entry.stack?.slice(0, 4000) ?? null,
      url: entry.url?.slice(0, 300) ?? null,
      user_agent: entry.userAgent?.slice(0, 250) ?? null,
    });
  } catch {
    // Logging is best-effort only.
  }
}
