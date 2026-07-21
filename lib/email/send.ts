import { Resend } from "resend";
import { COMPANY } from "../company";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const resend = getResend();
  const from = process.env.RESEND_FROM || `${COMPANY.name} <onboarding@resend.dev>`;

  if (!resend) {
    console.warn("[email] RESEND_API_KEY ausente — e-mail não enviado:", opts.subject);
    return { skipped: true as const };
  }

  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error("[email] falha:", error);
    throw new Error(error.message);
  }

  return { skipped: false as const };
}
