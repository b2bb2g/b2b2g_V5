import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Daily reminder sweep (Vercel Cron): members whose active membership
// expires within a week get a subscription_expiring notification, which
// rides the existing realtime + web-push pipeline. A per-member 6-day
// dedupe window keeps the daily schedule from repeating itself.
const WINDOW_DAYS = 7;
const DEDUPE_DAYS = 6;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ ok: false, reason: "not_configured" });
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date();
  const windowEnd = new Date(
    now.getTime() + WINDOW_DAYS * 86400_000,
  ).toISOString();
  const { data: expiring, error } = await supabase
    .from("subscriptions")
    .select("id, profile_id, expires_at")
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .lte("expires_at", windowEnd);
  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (!expiring?.length) return NextResponse.json({ ok: true, sent: 0 });

  const dedupeStart = new Date(
    now.getTime() - DEDUPE_DAYS * 86400_000,
  ).toISOString();
  const { data: recent } = await supabase
    .from("notifications")
    .select("profile_id")
    .eq("type", "subscription_expiring")
    .gte("created_at", dedupeStart)
    .in(
      "profile_id",
      expiring.map((row) => row.profile_id),
    );
  const alreadyNotified = new Set(
    (recent ?? []).map((row) => row.profile_id),
  );

  const pending = expiring.filter(
    (row) => !alreadyNotified.has(row.profile_id),
  );
  if (pending.length) {
    await supabase.from("notifications").insert(
      pending.map((row) => ({
        profile_id: row.profile_id,
        type: "subscription_expiring",
        payload: {
          subscription_id: row.id,
          expires_at: row.expires_at,
        },
      })),
    );
  }
  return NextResponse.json({ ok: true, sent: pending.length });
}
