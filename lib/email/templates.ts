import { COMPANY } from "../company";
import { formatBRL } from "../pricing";

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#faf7f9;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#15151a;">
  <div style="max-width:560px;margin:28px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(20,20,30,.08);border:1px solid #f0e4ec;">
    <div style="background:linear-gradient(135deg,#e91e8c,#a80f61);padding:28px 32px;">
      <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ffc2e3;font-weight:700;">${escapeHtml(COMPANY.name)}</p>
      <h1 style="margin:10px 0 0;font-size:22px;color:#fff;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(title)}</h1>
    </div>
    <div style="padding:28px 32px;font-size:15px;line-height:1.65;color:#3c3c45;">${body}</div>
    <div style="padding:18px 32px 24px;background:#fdf1f8;font-size:12px;color:#71717a;line-height:1.55;border-top:1px solid #fce4f1;">
      ${escapeHtml(COMPANY.phone)} · urgência ${escapeHtml(COMPANY.urgencyPhone)}<br/>
      ${escapeHtml(COMPANY.email)}<br/>
      ${escapeHtml(COMPANY.address)} · CNPJ ${escapeHtml(COMPANY.cnpj)}
    </div>
  </div>
</body>
</html>`;
}

export function confirmationEmailHtml(data: {
  studentName: string;
  age: number | null;
  coursesText: string;
  modality: string;
  plan: string;
  planDetail: string;
  paymentMethod: string;
  enrollmentFee: number;
  autoRenew: boolean;
  referralCode?: string | null;
  editUrl?: string;
}) {
  const ageText = data.age != null ? `${data.age} anos` : "—";
  const referralBlock = data.referralCode
    ? `<li><strong>Seu código de indicação:</strong> <code style="background:#fce4f1;padding:2px 8px;border-radius:6px;color:#a80f61;">${escapeHtml(data.referralCode)}</code></li>`
    : "";
  const editBlock = data.editUrl
    ? `<p style="margin-top:18px;">Quer atualizar telefone ou e-mail? <a href="${escapeHtml(data.editUrl)}" style="color:#e91e8c;font-weight:700;">Editar dados básicos</a></p>`
    : "";
  const renewLine = data.autoRenew
    ? `<li><strong>Rematrícula automática:</strong> Sim</li>`
    : "";
  const body = `
    <p>Olá, <strong style="color:#15151a;">${escapeHtml(data.studentName)}</strong>!</p>
    <p>Sua matrícula na <strong>${escapeHtml(COMPANY.name)}</strong> foi recebida. Resumo:</p>
    <ul style="padding-left:18px;margin:16px 0;">
      <li><strong>Aluno:</strong> ${escapeHtml(data.studentName)} · ${escapeHtml(ageText)}</li>
      <li><strong>Curso(s):</strong> ${escapeHtml(data.coursesText)}</li>
      <li><strong>Modalidade:</strong> ${escapeHtml(data.modality)}</li>
      <li><strong>Plano:</strong> ${escapeHtml(data.plan)} — ${escapeHtml(data.planDetail)}</li>
      <li><strong>Pagamento:</strong> ${escapeHtml(data.paymentMethod)}</li>
      <li><strong>Taxa de matrícula:</strong> ${escapeHtml(formatBRL(data.enrollmentFee))}</li>
      ${renewLine}
      ${referralBlock}
    </ul>
    <p>Próximo passo: envie o resumo pelo WhatsApp da equipe para confirmarmos tudo.</p>
    ${editBlock}
    <p style="margin-top:20px;">Bem-vindo(a)! 🎉</p>
  `;
  return layout("Matrícula confirmada", body);
}

export function duplicateAlertHtml(data: {
  fullName: string;
  email: string;
  phone: string;
  classCodes: string[];
}) {
  const body = `
    <p>Possível matrícula duplicada detectada:</p>
    <ul style="padding-left:18px;">
      <li><strong>Nome:</strong> ${escapeHtml(data.fullName)}</li>
      <li><strong>E-mail:</strong> ${escapeHtml(data.email)}</li>
      <li><strong>Telefone:</strong> ${escapeHtml(data.phone)}</li>
      <li><strong>Turmas:</strong> ${escapeHtml(data.classCodes.join(", "))}</li>
    </ul>
  `;
  return layout("Alerta de duplicidade", body);
}

export function otpEmailHtml(code: string, studentName?: string | null) {
  const greet = studentName?.trim()
    ? `Olá, <strong style="color:#15151a;">${escapeHtml(studentName.trim())}</strong>!`
    : "Olá!";
  const body = `
    <p>${greet}</p>
    <p>Use o código abaixo para confirmar seu e-mail na matrícula da <strong>${escapeHtml(COMPANY.name)}</strong>:</p>
    <div style="margin:28px 0;padding:22px;border-radius:16px;background:linear-gradient(180deg,#fdf1f8,#fce4f1);text-align:center;border:1px solid #f5cfe3;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#a80f61;font-weight:700;">Código</p>
      <p style="margin:0;font-size:36px;letter-spacing:0.35em;font-weight:800;color:#e91e8c;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(code)}</p>
    </div>
    <p style="font-size:13px;color:#71717a;">Válido por 10 minutos. Se você não pediu este código, ignore este e-mail.</p>
  `;
  return layout("Código de verificação", body);
}

export function abandonmentEmailHtml(data: {
  fullName?: string | null;
  age?: number | null;
  email?: string | null;
  phone?: string | null;
  grade?: string | null;
  school?: string | null;
  referralSource?: string | null;
  coursesText?: string;
  currentStep: number;
  lastActivityAt: string;
}) {
  const body = `
    <p>Olá, equipe ${escapeHtml(COMPANY.name)}!</p>
    <p>Uma matrícula ficou parada há mais de 1 hora e pode ter sido abandonada:</p>
    <ul style="padding-left:18px;">
      <li><strong>Nome:</strong> ${escapeHtml(data.fullName || "não preenchido")}</li>
      <li><strong>Idade:</strong> ${data.age != null ? data.age : "—"}</li>
      <li><strong>E-mail:</strong> ${escapeHtml(data.email || "—")}</li>
      <li><strong>Telefone/WhatsApp:</strong> ${escapeHtml(data.phone || "—")}</li>
      <li><strong>Série:</strong> ${escapeHtml(data.grade || "—")}</li>
      <li><strong>Onde estuda:</strong> ${escapeHtml(data.school || "—")}</li>
      <li><strong>Como conheceu:</strong> ${escapeHtml(data.referralSource || "—")}</li>
      <li><strong>Curso(s):</strong> ${escapeHtml(data.coursesText || "—")}</li>
      <li><strong>Último passo:</strong> Passo ${data.currentStep}</li>
      <li><strong>Parou às:</strong> ${escapeHtml(data.lastActivityAt)}</li>
    </ul>
    <p>Vale chamar no WhatsApp/e-mail cadastrado para ajudar a concluir.</p>
  `;
  return layout("Matrícula não finalizada", body);
}
