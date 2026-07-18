import { NextResponse, type NextRequest } from "next/server";
import { persistErrorLog } from "@/lib/error-log";

export const runtime = "nodejs";

// Client error boundary reporter. Loose in-memory throttle per instance
// keeps a buggy loop from flooding the log table.
let windowStart = 0;
let windowCount = 0;

export async function POST(request: NextRequest) {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount >= 30) return NextResponse.json({ ok: false });
  windowCount += 1;

  try {
    const body = (await request.json()) as {
      message?: string;
      stack?: string;
      url?: string;
    };
    if (!body.message) return NextResponse.json({ ok: false }, { status: 400 });
    await persistErrorLog({
      source: "client",
      message: String(body.message),
      stack: typeof body.stack === "string" ? body.stack : null,
      url: typeof body.url === "string" ? body.url : null,
      userAgent: request.headers.get("user-agent"),
    });
  } catch {
    // Ignore malformed reports.
  }
  return NextResponse.json({ ok: true });
}
