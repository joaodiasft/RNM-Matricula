#!/usr/bin/env node
/**
 * E-mail Doctor — diagnostica e testa o envio de e-mail da Redação Nota Mil.
 * Cobre Brevo, Resend e o webhook Gmail, na mesma ordem de prioridade do app.
 *
 *   node scripts/resend-doctor.mjs                 → diagnóstico (não envia nada)
 *   node scripts/resend-doctor.mjs --send          → envia teste p/ COMPANY_EMAIL
 *   node scripts/resend-doctor.mjs --send=voce@ex  → envia teste p/ endereço dado
 *
 * Lê as variáveis de .env.local (ou do ambiente). Sem dependências externas.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m",
};
const ok = (s) => console.log(`${c.green}✓${c.reset} ${s}`);
const warn = (s) => console.log(`${c.yellow}▲${c.reset} ${s}`);
const bad = (s) => console.log(`${c.red}✗${c.reset} ${s}`);
const info = (s) => console.log(`${c.dim}·${c.reset} ${s}`);
const head = (s) => console.log(`\n${c.bold}${c.cyan}${s}${c.reset}`);

function loadEnvLocal() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (env[k] === undefined) env[k] = v;
    }
  } catch {
    info(".env.local não encontrado — usando apenas variáveis do ambiente.");
  }
  return env;
}

const addr = (s) => {
  const m = String(s || "").match(/<([^>]+)>/);
  return (m ? m[1] : String(s || "")).trim();
};
const domainOf = (email) => (addr(email).split("@")[1] || "").toLowerCase();

async function main() {
  const env = loadEnvLocal();
  const args = process.argv.slice(2);
  const sendArg = args.find((a) => a === "--send" || a.startsWith("--send="));
  const doSend = Boolean(sendArg);
  const sendTarget =
    sendArg && sendArg.includes("=") ? sendArg.split("=")[1] : env.COMPANY_EMAIL || env.ADMIN_EMAIL;

  console.log(`${c.bold}E-mail Doctor · Redação Nota Mil${c.reset}`);

  const replyTo = env.RESEND_REPLY_TO || env.COMPANY_EMAIL || "naredacaonota1000@gmail.com";
  const brevoKey = env.BREVO_API_KEY;
  const brevoSender = env.BREVO_SENDER || env.COMPANY_EMAIL || "naredacaonota1000@gmail.com";
  const brevoSenderName = env.BREVO_SENDER_NAME || "Redação Nota Mil";
  const resendKey = env.RESEND_API_KEY;
  const resendFrom = env.RESEND_FROM || "Redação Nota Mil <onboarding@resend.dev>";
  const webhook = env.EMAIL_WEBHOOK_URL;

  let brevoReady = false;
  let resendReady = false;
  let webhookReady = false;

  // ── Brevo ───────────────────────────────────────────────────
  head("Brevo (remetente único, sem domínio)");
  if (!brevoKey) {
    info("BREVO_API_KEY não configurada.");
    info("Crie grátis em brevo.com → SMTP & API → API Keys, e cole em .env.local.");
  } else {
    ok(`BREVO_API_KEY presente (${brevoKey.slice(0, 10)}…).`);
    try {
      const acc = await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": brevoKey } });
      if (acc.status === 200) {
        const a = await acc.json().catch(() => ({}));
        ok(`Chave válida — conta ${a.email || "?"}.`);
      } else if (acc.status === 401) {
        bad("Chave Brevo inválida (401).");
      }
      const sres = await fetch("https://api.brevo.com/v3/senders", { headers: { "api-key": brevoKey } });
      if (sres.status === 200) {
        const body = await sres.json().catch(() => ({}));
        const senders = body.senders || [];
        const mine = senders.find((s) => (s.email || "").toLowerCase() === addr(brevoSender).toLowerCase());
        if (!senders.length) {
          bad("Nenhum remetente cadastrado no Brevo.");
          info(`Adicione "${addr(brevoSender)}" em brevo.com → Senders → Add a sender e confirme por e-mail.`);
        } else if (!mine) {
          warn(`Remetente "${addr(brevoSender)}" não está na conta. Cadastrados: ${senders.map((s) => s.email).join(", ")}`);
        } else if (mine.active) {
          ok(`Remetente "${addr(brevoSender)}" VERIFICADO — pode enviar para qualquer aluno. 🎉`);
          brevoReady = true;
        } else {
          warn(`Remetente "${addr(brevoSender)}" cadastrado mas NÃO confirmado. Clique no link que o Brevo enviou por e-mail.`);
        }
      }
    } catch (e) {
      warn(`Não consegui falar com a API do Brevo: ${e.message}`);
    }
    info(`Sender atual: ${brevoSenderName} <${addr(brevoSender)}> · Reply-To: ${replyTo}`);
  }

  // ── Resend ──────────────────────────────────────────────────
  head("Resend (exige domínio verificado)");
  if (!resendKey) {
    info("RESEND_API_KEY não configurada.");
  } else {
    ok(`RESEND_API_KEY presente (${resendKey.slice(0, 6)}…).`);
    try {
      const { status, body } = await (async () => {
        const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${resendKey}` } });
        return { status: r.status, body: await r.json().catch(() => ({})) };
      })();
      if (status === 200) {
        const verified = (body.data || []).filter((d) => d.status === "verified").map((d) => d.name.toLowerCase());
        const fromDomain = domainOf(resendFrom);
        if (fromDomain === "resend.dev") {
          warn("From = onboarding@resend.dev (SANDBOX): só entrega ao dono da conta.");
        } else if (verified.includes(fromDomain)) {
          ok(`Domínio "${fromDomain}" verificado — Resend pronto.`);
          resendReady = true;
        } else {
          warn(`Domínio "${fromDomain}" não verificado (verificados: ${verified.join(", ") || "nenhum"}).`);
        }
      } else if (status === 401) {
        bad("Chave Resend inválida (401).");
      }
    } catch (e) {
      warn(`Não consegui falar com a API do Resend: ${e.message}`);
    }
  }

  // ── Webhook Gmail ───────────────────────────────────────────
  head("Webhook Gmail");
  if (!webhook) {
    info("EMAIL_WEBHOOK_URL não configurada (opcional).");
  } else {
    try {
      const res = await fetch(webhook, { method: "GET" });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) { ok("Webhook respondeu OK."); webhookReady = true; }
      else warn(`Webhook respondeu ${res.status}.`);
    } catch (e) {
      warn(`Não alcancei o webhook: ${e.message}`);
    }
  }

  // ── Teste de envio (mesma prioridade do app: webhook > brevo > resend) ──
  head("Teste de envio");
  if (!doSend) {
    info("Diagnóstico apenas. Para enviar um teste real:");
    info(`  ${c.bold}node scripts/resend-doctor.mjs --send${c.reset}`);
  } else {
    const testHtml = "<p>Funcionando! Teste do sistema de matrícula da Redação Nota Mil.</p>";
    const testText = "Funcionando! Teste do sistema de matrícula da Redação Nota Mil.";
    const subject = "Teste de e-mail — Redação Nota Mil";
    if (webhook) {
      info(`Enviando via WEBHOOK para ${sendTarget}…`);
      try {
        const res = await fetch(webhook, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: sendTarget, subject, html: testHtml, text: testText, replyTo, fromName: "Redação Nota Mil", secret: env.EMAIL_WEBHOOK_SECRET || "" }),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.ok !== false) ok(`Enviado via Gmail para ${sendTarget}.`);
        else bad(`Webhook falhou: ${body.error || res.status}`);
      } catch (e) { bad(`Erro de rede: ${e.message}`); }
    } else if (brevoKey) {
      info(`Enviando via BREVO (${addr(brevoSender)}) para ${sendTarget}…`);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: brevoSenderName, email: addr(brevoSender) },
          to: [{ email: sendTarget }],
          subject, htmlContent: testHtml, textContent: testText,
          replyTo: { email: addr(replyTo) },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 201 && body.messageId) ok(`Enviado! messageId=${body.messageId}. Confira ${sendTarget} (e spam).`);
      else { bad(`Brevo recusou (${res.status}): ${body.message || JSON.stringify(body)}`); if (!brevoReady) info("Provável causa: remetente ainda não confirmado no Brevo."); }
    } else if (resendKey) {
      info(`Enviando via RESEND (${resendFrom}) para ${sendTarget}…`);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: resendFrom, to: sendTarget, reply_to: replyTo, subject, html: testHtml, text: testText }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.id) ok(`Enviado! id=${body.id}. Confira ${sendTarget} (e spam).`);
      else bad(`Resend recusou (${res.status}): ${body.message || JSON.stringify(body)}`);
    } else {
      bad("Nenhum provedor configurado — nada para testar.");
    }
  }

  // ── Veredito ────────────────────────────────────────────────
  head("Veredito");
  if (brevoReady || resendReady || webhookReady) {
    const via = brevoReady ? "Brevo" : resendReady ? "Resend" : "Webhook Gmail";
    ok(`E-mail FUNCIONAL via ${via}. 🎉 Rode com --send para confirmar a entrega.`);
  } else {
    warn("E-mail ainda não funcional para alunos. Caminho recomendado (Brevo, sem domínio):");
    info("1) Crie conta grátis em brevo.com");
    info("2) Senders → Add a sender: naredacaonota1000@gmail.com → confirme pelo link no e-mail");
    info("3) SMTP & API → API Keys → gere uma chave");
    info("4) Em .env.local:  BREVO_API_KEY=...   BREVO_SENDER=naredacaonota1000@gmail.com");
    info("5) node scripts/resend-doctor.mjs --send");
  }
  console.log("");
}

main().catch((e) => {
  console.error(`${c.red}Erro inesperado:${c.reset}`, e);
  process.exit(1);
});
