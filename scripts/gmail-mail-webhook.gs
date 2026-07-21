/**
 * Google Apps Script — envio de e-mail via Gmail (qualquer destinatário).
 *
 * 1. Acesse https://script.google.com com a conta naredacaonota1000@gmail.com
 * 2. Novo projeto → cole este código
 * 3. Implantar → Nova implantação → Tipo: App da Web
 *    - Executar como: Eu
 *    - Quem tem acesso: Qualquer pessoa
 * 4. Copie a URL da implantação
 * 5. Configure o secret no Cloudflare:
 *      npx wrangler secret put EMAIL_WEBHOOK_URL
 *    e em .env.local: EMAIL_WEBHOOK_URL=https://script.google.com/...
 *
 * Assim o OTP funciona para qualquer e-mail de aluno (sem domínio no Resend).
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const to = data.to;
    const subject = String(data.subject || "Mensagem");
    const html = String(data.html || "");
    const name = String(data.fromName || "Redação Nota Mil");

    if (!to || !html) {
      return json_({ ok: false, error: "to e html são obrigatórios" });
    }

    const recipients = Array.isArray(to) ? to.join(",") : String(to);
    GmailApp.sendEmail(recipients, subject, strip_(html), {
      htmlBody: html,
      name: name,
      noReply: true,
    });

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
