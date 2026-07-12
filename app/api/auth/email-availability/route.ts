import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  let body: { email?: unknown; invite?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ state: "invalid" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 320) : "";
  const invite = typeof body.invite === "string" ? body.invite.slice(0, 256) : null;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (bucket && bucket.resetAt > now && bucket.count >= 15) {
    return NextResponse.json({ state: "rate_limited" }, { status: 429 });
  }
  rateBuckets.set(ip, bucket && bucket.resetAt > now
    ? { ...bucket, count: bucket.count + 1 }
    : { count: 1, resetAt: now + 60_000 });
  const supabase = await createClient();
  if (invite) {
    const { data: invitation } = await supabase.rpc("validate_referral_invitation", {
      p_token: invite,
      p_email: email,
    });
    if (invitation?.[0]?.state === "email_mismatch") {
      return NextResponse.json({ state: "email_mismatch" }, { status: 200 });
    }
  }
  const { data, error } = await supabase.rpc("check_signup_email", {
    p_email: email,
    p_invite_token: invite,
  });
  if (error) {
    console.error("email availability check failed", error.message);
    return NextResponse.json({ state: "unavailable" }, { status: 503 });
  }
  return NextResponse.json(
    { state: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
