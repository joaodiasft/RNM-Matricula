import { Resend } from "resend";
import { COMPANY } from "../company";
import { getEnv } from "../db";

function getResend() {
  const key = getEnv("RESEND_API_KEY") || process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

type SendResult =
  | { skipped: true }
  | { skipped: false; error?: undefined; code?: undefined }
  | {
      skipped: false;
      error: string;
      code: "sandbox" | "config" | "unknown";
    };

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<SendResult> {
  const webhook =
    getEnv("EMAIL_WEBHOOK_URL") || process.env.EMAIL_WEBHOOK_URL || "";

  // Webhook (ex.: Google Apps Script + Gmail) envia para qualquer destinatário
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: opts.to,
          subject: opts.subject,
          html: opts.html,
          fromName: COMPANY.name,
        }),
      });
      if (res.ok) return { skipped: false };
      const text = await res.text().catch(() => "");
      console.error("[email] webhook falhou:", res.status, text);
    } catch (err) {
      console.error("[email] webhook erro:", err);
    }
  }

  const resend = getResend();
  const from =
    getEnv("RESEND_FROM") ||
    process.env.RESEND_FROM ||
    `${COMPANY.name} <onboarding@resend.dev>`;

  if (!resend) {
    console.warn("[email] RESEND_API_KEY ausente — e-mail não enviado:", opts.subject);
    return { skipped: true };
  }

  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error("[email] falha:", error);
    const msg = error.message || "Falha ao enviar e-mail";
    return { skipped: false, error: msg, code: classifyEmailError(msg) };
  }

  return { skipped: false };
}

function classifyEmailError(message: string): "sandbox" | "config" | "unknown" {
  const m = message.toLowerCase();
  if (
    m.includes("testing email") ||
    m.includes("verify a domain") ||
    m.includes("only send testing") ||
    m.includes("invalid `to` field")
  ) {
    return "sandbox";
  }
  if (m.includes("api key") || m.includes("unauthorized") || m.includes("forbidden")) {
    return "config";
  }
  return "unknown";
}
