import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

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

  const summary = `${monthKey} 월간 리포트 · 신규 가입 ${members.count ?? 0} · 신규 게시물 ${posts.count ?? 0} · 신규 문의 ${inquiries.count ?? 0} · 소셜 게시물 ${feedPosts.count ?? 0}`;

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
  const rows = [
    ["신규 가입", members.count ?? 0],
    ["신규 게시물", posts.count ?? 0],
    ["신규 문의", inquiries.count ?? 0],
    ["소셜 게시물", feedPosts.count ?? 0],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 14px;border-bottom:1px solid #e8eaee;color:#5b6472">${label}</td><td style="padding:8px 14px;border-bottom:1px solid #e8eaee;font-weight:700;text-align:right">${value}</td></tr>`,
    )
    .join("");
  const topHtml = topLines.length
    ? `<p style="margin:18px 0 6px;font-weight:700">이달의 찜 상위 상품</p><ol style="margin:0;padding-left:20px;color:#374151">${topLines.map((line) => `<li style="margin:3px 0">${line}</li>`).join("")}</ol>`
    : "";
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px"><h2 style="margin:0 0 4px">B2BB2G 월간 운영 리포트</h2><p style="margin:0 0 16px;color:#5b6472">${monthKey}</p><table style="border-collapse:collapse;width:100%">${rows}</table>${topHtml}<p style="margin:20px 0 0"><a href="https://b2bb2g.com/admin" style="color:#1b64da;font-weight:700">관리자 콘솔 열기</a></p></div>`;

  let emailed = 0;
  for (const admin of admins) {
    const contacts = admin.profile_contacts as unknown as
      | { email: string | null }
      | { email: string | null }[]
      | null;
    const email = Array.isArray(contacts)
      ? contacts[0]?.email
      : contacts?.email;
    if (!email) continue;
    const { sent } = await sendEmail({
      to: email,
      subject: `B2BB2G 월간 리포트 · ${monthKey}`,
      html,
    });
    if (sent) emailed += 1;
  }

  return NextResponse.json({ ok: true, sent: admins.length, emailed, monthKey });
}
