/**
 * Google Apps Script — envio de e-mail via Gmail (qualquer destinatário).
 *
 * Faz o sistema de matrícula enviar e-mail (OTP, confirmação, avisos) SEM precisar
 * de domínio verificado no Resend. Envia da própria conta Gmail da secretaria.
 *
 * ── Passo a passo ────────────────────────────────────────────────────────────
 * 1. Acesse https://script.google.com com a conta naredacaonota1000@gmail.com
 * 2. Novo projeto → cole este código.
 * 3. (Recomendado) Defina um segredo compartilhado:
 *      Projeto → ⚙ Configurações do projeto → Propriedades do script →
 *      Adicionar propriedade:  WEBHOOK_SECRET = <uma senha longa e aleatória>
 * 4. Implantar → Nova implantação → Tipo: "App da Web"
 *      - Executar como: Eu (naredacaonota1000@gmail.com)
 *      - Quem tem acesso: Qualquer pessoa
 * 5. Copie a URL da implantação (termina em /exec) e configure no app:
 *      npx wrangler secret put EMAIL_WEBHOOK_URL      (produção)
 *      npx wrangler secret put EMAIL_WEBHOOK_SECRET   (se usou o passo 3)
 *    e em .env.local (dev):
 *      EMAIL_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
 *      EMAIL_WEBHOOK_SECRET=<o mesmo segredo do passo 3>
 * 6. Teste:  node scripts/resend-doctor.mjs --send
 *
 * Limite do Gmail comum: ~500 destinatários/dia — folgado para uma matrícula.
 */

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Verificação do segredo (se configurado nas Propriedades do script).
    var expected = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");
    if (expected && String(data.secret || "") !== expected) {
      return json_({ ok: false, error: "unauthorized" });
    }

    var to = data.to;
    var subject = String(data.subject || "").trim();
    var html = String(data.html || "").trim();
    var text = String(data.text || "").trim() || strip_(html);
    var name = String(data.fromName || "Redação Nota Mil");
    var replyTo = String(data.replyTo || "").trim();

    if (!to || !subject || !html) {
      return json_({ ok: false, error: "to, subject e html são obrigatórios" });
    }

    var recipients = Array.isArray(to) ? to.join(",") : String(to);

    var options = {
      htmlBody: html,
      name: name,
    };
    if (text) options.body = text; // corpo texto puro (fallback)
    if (replyTo) options.replyTo = replyTo;

    GmailApp.sendEmail(recipients, subject, text || strip_(html), options);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "rnm-matricula-mail" });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function strip_(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
