// Resend transactional email helper (PRD 10.2, 15). Server only.
// Auth emails (signup verification, password reset) are sent by Supabase
// through its SMTP settings; this helper is for app notification emails,
// whose per-type on/off lives in site_settings (admin policy switches).

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(
  input: SendEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    // Not configured yet: skip silently so flows keep working without email.
    return { sent: false, error: "not_configured" };
  }

  const fromName = process.env.RESEND_FROM_NAME;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { sent: false, error: `resend_${response.status}: ${detail.slice(0, 200)}` };
  }
  return { sent: true };
}
