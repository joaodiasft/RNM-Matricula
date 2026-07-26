import { Resend } from "resend";
import { COMPANY } from "../company";
import { getEnv } from "../db";

/**
 * Camada de envio de e-mail — Redação Nota Mil.
 *
 * Tenta os provedores CONFIGURADOS em ordem, até um entregar:
 *   1. Webhook (Google Apps Script + Gmail) — se EMAIL_WEBHOOK_URL.
 *   2. Brevo (recomendado) — se BREVO_API_KEY. Remetente único verificado por
 *      link (o próprio Gmail), sem domínio. API HTTP, funciona no Cloudflare.
 *   3. Resend — se RESEND_API_KEY. Profissional, mas exige DOMÍNIO verificado
 *      (com onboarding@resend.dev só entrega ao dono da conta / sandbox).
 *
 * Todo envio inclui Reply-To para a secretaria e uma versão em texto puro.
 * Diagnóstico e teste: `npm run email:doctor`.
 */

const RESEND_DEFAULT_FROM = `${COMPANY.name} <onboarding@resend.dev>`;

export type SendVia = "resend" | "brevo" | "webhook";
export type SendCode = "sandbox" | "config" | "invalid" | "rate_limit" | "unknown";

export type SendResult =
  | { skipped: true; via?: undefined }
  | { skipped: false; via: SendVia; error?: undefined; code?: undefined }
  | { skipped: false; via?: SendVia; error: string; code: SendCode };

type SendOptions = {
  to: string | string[];
  subject: string;
  html: string;
  /** Texto puro opcional; se ausente, é derivado do HTML. */
  text?: string;
  /** Sobrescreve o Reply-To (padrão: e-mail da empresa). */
  replyTo?: string;
};

/** Resultado interno de um provedor. */
type ProviderResult =
  | { ok: true }
  | { ok: false; error: string; code: SendCode };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Extrai o endereço de "Nome <email@dominio>". */
function extractAddress(value: string): string {
  const m = value.match(/<([^>]+)>/);
  return (m ? m[1] : value).trim();
}

function validRecipient(to: string | string[]): boolean {
  const list = Array.isArray(to) ? to : [to];
  if (list.length === 0) return false;
  return list.every((addr) => EMAIL_RE.test(extractAddress(String(addr).trim())));
}

function toArray(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((t) => extractAddress(String(t)));
}

/** Deriva texto puro legível a partir do HTML. */
export function htmlToText(html: string): string {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function classifyEmailError(message: string): SendCode {
  const m = message.toLowerCase();
  if (m.includes("too many requests") || m.includes("rate limit")) return "rate_limit";
  if (
    m.includes("testing email") ||
    m.includes("verify a domain") ||
    m.includes("not verified") ||
    m.includes("sender not") ||
    m.includes("not a valid sender") ||
    m.includes("only send testing") ||
    m.includes("you can only send") ||
    m.includes("invalid `to` field")
  ) {
    return "sandbox";
  }
  if (
    m.includes("api key") ||
    m.includes("unauthorized") ||
    m.includes("forbidden") ||
    m.includes("restricted") ||
    m.includes("key not found")
  ) {
    return "config";
  }
  if (m.includes("invalid") || m.includes("missing")) return "invalid";
  return "unknown";
}

// ── Provedores ────────────────────────────────────────────────────────────────

async function sendViaWebhook(
  url: string,
  o: { to: string | string[]; subject: string; html: string; text: string; replyTo: string }
): Promise<ProviderResult> {
  const secret =
    getEnv("EMAIL_WEBHOOK_SECRET") || process.env.EMAIL_WEBHOOK_SECRET || "";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: o.to,
        subject: o.subject,
        html: o.html,
        text: o.text,
        replyTo: o.replyTo,
        fromName: COMPANY.name,
        secret,
      }),
    });
    if (res.ok) {
      const body = (await res.json().catch(() => ({ ok: true }))) as {
        ok?: boolean;
        error?: string;
      };
      if (body.ok !== false) return { ok: true };
      return { ok: false, error: body.error || "webhook recusou", code: "config" };
    }
    const t = await res.text().catch(() => "");
    return { ok: false, error: `webhook HTTP ${res.status} ${t.slice(0, 120)}`, code: "unknown" };
  } catch (err) {
    return { ok: false, error: `webhook rede: ${String(err)}`, code: "unknown" };
  }
}

async function sendViaBrevo(
  key: string,
  o: { to: string | string[]; subject: string; html: string; text: string; replyTo: string }
): Promise<ProviderResult> {
  const senderRaw =
    getEnv("BREVO_SENDER") ||
    process.env.BREVO_SENDER ||
    process.env.COMPANY_EMAIL ||
    COMPANY.email;
  const senderName =
    getEnv("BREVO_SENDER_NAME") || process.env.BREVO_SENDER_NAME || COMPANY.name;

  const payload = {
    sender: { name: senderName, email: extractAddress(senderRaw) },
    to: toArray(o.to).map((email) => ({ email })),
    subject: o.subject,
    htmlContent: o.html,
    textContent: o.text,
    replyTo: { email: extractAddress(o.replyTo) },
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": key,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 201 || res.ok) return { ok: true };

      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      const msg = body.message || `Brevo HTTP ${res.status}`;
      const code = res.status === 429 ? "rate_limit" : classifyEmailError(msg);
      if (code === "rate_limit" && attempt === 0) {
        await sleep(1100);
        continue;
      }
      return { ok: false, error: msg, code };
    } catch (err) {
      return { ok: false, error: `Brevo rede: ${String(err)}`, code: "unknown" };
    }
  }
  return { ok: false, error: "Brevo: limite de envio", code: "rate_limit" };
}

async function sendViaResend(
  key: string,
  o: { to: string | string[]; subject: string; html: string; text: string; replyTo: string }
): Promise<ProviderResult> {
  const resend = new Resend(key);
  const from = getEnv("RESEND_FROM") || process.env.RESEND_FROM || RESEND_DEFAULT_FROM;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await resend.emails.send({
      from,
      to: o.to,
      subject: o.subject,
      html: o.html,
      text: o.text,
      replyTo: o.replyTo,
    });
    if (!error) return { ok: true };

    const msg = error.message || "Falha ao enviar e-mail";
    const code = classifyEmailError(msg);
    if (code === "rate_limit" && attempt === 0) {
      await sleep(1100);
      continue;
    }
    return { ok: false, error: msg, code };
  }
  return { ok: false, error: "Resend: limite de envio", code: "rate_limit" };
}

// ── Orquestração ──────────────────────────────────────────────────────────────

export async function sendEmail(opts: SendOptions): Promise<SendResult> {
  const subject = (opts.subject ?? "").trim();
  const html = (opts.html ?? "").trim();
  const replyTo =
    opts.replyTo ||
    getEnv("RESEND_REPLY_TO") ||
    process.env.RESEND_REPLY_TO ||
    process.env.COMPANY_EMAIL ||
    COMPANY.email;
  const text = (opts.text && opts.text.trim()) || htmlToText(html);

  if (!validRecipient(opts.to)) {
    console.error("[email] destinatário inválido:", opts.to);
    return { skipped: false, error: "Destinatário inválido", code: "invalid" };
  }
  if (!subject || !html) {
    console.error("[email] subject/html vazios — envio abortado");
    return { skipped: false, error: "Assunto ou corpo vazio", code: "invalid" };
  }

  const payload = { to: opts.to, subject, html, text, replyTo };

  const webhookUrl = getEnv("EMAIL_WEBHOOK_URL") || process.env.EMAIL_WEBHOOK_URL || "";
  const brevoKey = getEnv("BREVO_API_KEY") || process.env.BREVO_API_KEY || "";
  const resendKey = getEnv("RESEND_API_KEY") || process.env.RESEND_API_KEY || "";

  const providers: { via: SendVia; run: () => Promise<ProviderResult> }[] = [];
  if (webhookUrl) providers.push({ via: "webhook", run: () => sendViaWebhook(webhookUrl, payload) });
  if (brevoKey) providers.push({ via: "brevo", run: () => sendViaBrevo(brevoKey, payload) });
  if (resendKey) providers.push({ via: "resend", run: () => sendViaResend(resendKey, payload) });

  if (providers.length === 0) {
    console.warn("[email] nenhum provedor configurado — e-mail não enviado:", subject);
    return { skipped: true };
  }

  let last: { via: SendVia; error: string; code: SendCode } | null = null;
  for (const p of providers) {
    const r = await p.run();
    if (r.ok) return { skipped: false, via: p.via };
    console.error(`[email] ${p.via} falhou:`, r.code, r.error);
    last = { via: p.via, error: r.error, code: r.code };
    // tenta o próximo provedor configurado
  }

  return {
    skipped: false,
    via: last!.via,
    error: last!.error,
    code: last!.code,
  };
}
