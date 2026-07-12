import "server-only";

import { sendEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendSecurityEmail(input: {
  to: string;
  kind: "new_device" | "failed_attempts";
  device: string;
  location: string;
  ip: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = input.kind === "new_device"
    ? "New sign-in to your B2BB2G account"
    : "Several unsuccessful sign-in attempts detected";
  const lead = input.kind === "new_device"
    ? "We noticed a sign-in from a browser or device we did not recognize."
    : "Several unsuccessful sign-in attempts were made on your account within 15 minutes.";
  const result = await sendEmail({
    to: input.to,
    subject: title,
    html: `<p>${lead}</p><ul><li>Device: ${escapeHtml(input.device)}</li><li>Approximate location: ${escapeHtml(input.location || "Unknown")}</li><li>IP: ${escapeHtml(input.ip)}</li></ul><p>If this was not you, reset your password and review active devices.</p><p><a href="${siteUrl}/dashboard/security">Review account security</a></p>`,
  });
  if (!result.sent && result.error !== "not_configured") {
    console.error("security email failed", result.error);
  }
}
