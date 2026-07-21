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
  // Only record + alert for real (production) errors. Local dev points at the
  // same Supabase, so without this a developer's transient hot-reload errors
  // would pollute the shared error log and push false "app error" alerts to
  // real admins.
  if (process.env.NODE_ENV !== "production") return;
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

    // Retention: the log is an operational window, not an archive.
    const retentionCutoff = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    await supabase
      .from("app_error_logs")
      .delete()
      .lt("created_at", retentionCutoff);

    // Server errors alert admins (in-app + push), throttled to one alert
    // per 15 minutes so an error storm cannot spam anyone.
    if (entry.source === "server") {
      const throttleWindow = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("notifications")
        .select("id")
        .eq("type", "app_error_alert")
        .gte("created_at", throttleWindow)
        .limit(1);
      if (!recent?.length) {
        const { data: admins } = await supabase
          .from("profiles")
          .select("id")
          .eq("is_admin", true);
        if (admins?.length) {
          await supabase.from("notifications").insert(
            admins.map((admin) => ({
              profile_id: admin.id,
              type: "app_error_alert",
              payload: { message: entry.message.slice(0, 120) },
            })),
          );
        }
      }
    }
  } catch {
    // Logging is best-effort only.
  }
}
