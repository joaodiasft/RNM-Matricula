import { Resend } from "resend";
import { COMPANY } from "../company";
import { getEnv } from "../db";

function getResend() {
  const key = getEnv("RESEND_API_KEY") || process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const resend = getResend();
  const from =
    getEnv("RESEND_FROM") ||
    process.env.RESEND_FROM ||
    `${COMPANY.name} <onboarding@resend.dev>`;

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
    // Não derruba o fluxo (cron/matrícula): Resend sandbox / domínio
    // não verificado costuma falhar até haver domínio próprio.
    return { skipped: false as const, error: error.message };
  }

  return { skipped: false as const };
}
