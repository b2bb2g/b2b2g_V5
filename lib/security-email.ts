import "server-only";

import { sendEmail } from "@/lib/email";
import { securityEmail } from "@/lib/notifications/email-content";

export async function sendSecurityEmail(input: {
  to: string;
  kind: "new_device" | "failed_attempts" | "suspicious_signin";
  device: string;
  location: string;
  ip: string;
}) {
  const result = await sendEmail({
    to: input.to,
    ...securityEmail(input.kind, {
      device: input.device,
      location: input.location,
      ip: input.ip,
    }),
  });
  if (!result.sent && result.error !== "not_configured") {
    console.error("security email failed", result.error);
  }
}
