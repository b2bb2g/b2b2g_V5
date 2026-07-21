import "server-only";

// All server-sent email + system-notice copy lives here so no user-facing
// string is hardcoded inside a route handler or action. Transactional emails
// are bilingual (Korean + English) because a per-recipient locale is not
// reliably resolvable at send time.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://b2bb2g.com";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---- Lost-authenticator (MFA) reset ----
export function mfaResetEmail(code: string): { subject: string; html: string } {
  return {
    subject: `B2BB2G 인증 재설정 코드 · MFA reset code ${code}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:460px"><h2 style="margin:0 0 10px">OTP 인증 재설정 · Reset your authenticator</h2><p style="margin:0 0 14px;color:#5b6472">아래 코드를 입력하면 기존 인증기 등록이 해제되고 새 기기를 등록할 수 있습니다. 10분간 유효합니다.<br/>Enter this code to remove your lost authenticator and enroll a new device. Valid for 10 minutes.</p><p style="font-size:30px;font-weight:800;letter-spacing:.3em;margin:0">${code}</p><p style="margin:16px 0 0;color:#8a93a1;font-size:12px">본인이 요청하지 않았다면 이 메일을 무시하세요. If you did not request this, ignore this email.</p></div>`,
  };
}

export function mfaResetNoticeMessage(): string {
  return "OTP 인증이 재설정되었습니다. 새 기기를 등록해 주세요. / Your authenticator was reset - enroll a new device.";
}

// ---- Sign-in security alerts ----
type SecurityKind = "new_device" | "failed_attempts" | "suspicious_signin";

export function securityEmail(
  kind: SecurityKind,
  ctx: { device: string; location: string; ip: string },
): { subject: string; html: string } {
  const copy = {
    new_device: {
      title: "새 로그인 감지 · New sign-in to your B2BB2G account",
      lead: "인식하지 못한 브라우저 또는 기기에서 로그인이 감지되었습니다. We noticed a sign-in from a browser or device we did not recognize.",
    },
    suspicious_signin: {
      title: "다른 지역 로그인 감지 · Sign-in from a different location",
      lead: "최근 활동과 다른 국가에서 로그인이 감지되었습니다. We noticed a sign-in from a country that differs from your recent activity.",
    },
    failed_attempts: {
      title: "로그인 시도 실패 감지 · Several unsuccessful sign-in attempts detected",
      lead: "15분 이내에 계정에서 여러 번의 로그인 실패가 있었습니다. Several unsuccessful sign-in attempts were made on your account within 15 minutes.",
    },
  }[kind];
  return {
    subject: copy.title,
    html: `<p>${copy.lead}</p><ul><li>기기 · Device: ${esc(ctx.device)}</li><li>대략 위치 · Approximate location: ${esc(ctx.location || "Unknown")}</li><li>IP: ${esc(ctx.ip)}</li></ul><p>본인이 아니라면 비밀번호를 변경하고 활성 기기를 확인하세요. If this was not you, reset your password and review active devices.</p><p><a href="${SITE}/dashboard/security">계정 보안 확인 · Review account security</a></p>`,
  };
}

// ---- Monthly operations report (admin-facing) ----
export type MonthlyCounts = {
  members: number;
  posts: number;
  inquiries: number;
  feedPosts: number;
};

export function monthlyReportSummary(
  monthKey: string,
  c: MonthlyCounts,
): string {
  return `${monthKey} 월간 리포트 · Monthly report · 신규 가입/Signups ${c.members} · 신규 게시물/Posts ${c.posts} · 신규 문의/Inquiries ${c.inquiries} · 소셜 게시물/Social ${c.feedPosts}`;
}

export function monthlyReportEmail(
  monthKey: string,
  c: MonthlyCounts,
  topLines: string[],
): { subject: string; html: string } {
  const rows = [
    ["신규 가입 · Signups", c.members],
    ["신규 게시물 · Posts", c.posts],
    ["신규 문의 · Inquiries", c.inquiries],
    ["소셜 게시물 · Social posts", c.feedPosts],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 14px;border-bottom:1px solid #e8eaee;color:#5b6472">${label}</td><td style="padding:8px 14px;border-bottom:1px solid #e8eaee;font-weight:700;text-align:right">${value}</td></tr>`,
    )
    .join("");
  const topHtml = topLines.length
    ? `<p style="margin:18px 0 6px;font-weight:700">이달의 저장 상위 상품 · Most-saved products</p><ol style="margin:0;padding-left:20px;color:#374151">${topLines
        .map((line) => `<li style="margin:3px 0">${esc(line)}</li>`)
        .join("")}</ol>`
    : "";
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px"><h2 style="margin:0 0 4px">B2BB2G 월간 운영 리포트 · Monthly operations report</h2><p style="margin:0 0 16px;color:#5b6472">${monthKey}</p><table style="border-collapse:collapse;width:100%">${rows}</table>${topHtml}<p style="margin:20px 0 0"><a href="${SITE}/admin" style="color:#1b64da;font-weight:700">관리자 콘솔 열기 · Open admin console</a></p></div>`;
  return {
    subject: `B2BB2G 월간 리포트 · Monthly report · ${monthKey}`,
    html,
  };
}
