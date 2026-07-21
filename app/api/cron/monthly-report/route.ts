import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import {
  monthlyReportEmail,
  monthlyReportSummary,
} from "@/lib/notifications/email-content";

export const runtime = "nodejs";

// First-of-month operations digest for admins: last month's growth numbers
// and the most-saved products, delivered in-app (rides the push pipeline)
// and by email when Resend is configured. Keyed by report month so reruns
// are no-ops.
export async function GET(request: NextRequest) {
  // Fail closed: an unset CRON_SECRET must reject, never run this service-role
  // job for an unauthenticated caller.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
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

  // Previous calendar month (UTC).
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = monthStart.toISOString().slice(0, 7);
  const start = monthStart.toISOString();
  const end = monthEnd.toISOString();

  // Rerun guard: one report per month.
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("type", "admin_notice")
    .eq("payload->>report_month", monthKey)
    .limit(1);
  if (existing?.length) {
    return NextResponse.json({ ok: true, skipped: "already_sent", monthKey });
  }

  const between = (table: string) =>
    supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", start)
      .lt("created_at", end);
  const [members, posts, inquiries, feedPosts, { data: monthBookmarks }] =
    await Promise.all([
      between("profiles"),
      between("posts"),
      between("inquiries"),
      between("member_feed_posts"),
      supabase
        .from("post_bookmarks")
        .select("post_id")
        .gte("created_at", start)
        .lt("created_at", end)
        .limit(2000),
    ]);

  // Most-saved products of the month.
  const saveCounts = new Map<string, number>();
  for (const row of monthBookmarks ?? []) {
    saveCounts.set(row.post_id, (saveCounts.get(row.post_id) ?? 0) + 1);
  }
  const topIds = [...saveCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const { data: topPosts } = topIds.length
    ? await supabase
        .from("public_posts")
        .select("id, title_ko, title_en")
        .in("id", topIds)
    : { data: [] as { id: string; title_ko: string | null; title_en: string }[] };
  const topLines = topIds
    .map((id) => {
      const post = (topPosts ?? []).find((row) => row.id === id);
      if (!post) return null;
      return `${post.title_ko ?? post.title_en} (${saveCounts.get(id)})`;
    })
    .filter(Boolean) as string[];

  const counts = {
    members: members.count ?? 0,
    posts: posts.count ?? 0,
    inquiries: inquiries.count ?? 0,
    feedPosts: feedPosts.count ?? 0,
  };
  const summary = monthlyReportSummary(monthKey, counts);

  // In-app notice for every admin (push rides the notifications trigger).
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, profile_contacts(email)")
    .eq("is_admin", true);
  if (!admins?.length) return NextResponse.json({ ok: true, sent: 0 });
  await supabase.from("notifications").insert(
    admins.map((admin) => ({
      profile_id: admin.id,
      type: "admin_notice",
      payload: { message: summary, report_month: monthKey },
    })),
  );

  // Email digest (skipped silently when Resend is unconfigured).
  const email = monthlyReportEmail(monthKey, counts, topLines);

  let emailed = 0;
  for (const admin of admins) {
    const contacts = admin.profile_contacts as unknown as
      | { email: string | null }
      | { email: string | null }[]
      | null;
    const address = Array.isArray(contacts)
      ? contacts[0]?.email
      : contacts?.email;
    if (!address) continue;
    const { sent } = await sendEmail({ to: address, ...email });
    if (sent) emailed += 1;
  }

  return NextResponse.json({ ok: true, sent: admins.length, emailed, monthKey });
}
