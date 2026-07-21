import { COMPANY } from "../company";
import { formatBRL } from "../pricing";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f7f5;font-family:Georgia,'Times New Roman',serif;color:#1a2e24;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,46,36,.08);">
    <div style="background:linear-gradient(135deg,#0d4f3c,#1a7a5c);padding:28px 32px;">
      <p style="margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a8e6cf;">${escapeHtml(COMPANY.name)}</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:600;">${escapeHtml(title)}</h1>
    </div>
    <div style="padding:28px 32px;font-size:15px;line-height:1.6;">${body}</div>
    <div style="padding:20px 32px;background:#f0f5f2;font-size:12px;color:#5a6e64;line-height:1.5;">
      📞 ${escapeHtml(COMPANY.phone)} · urgência ${escapeHtml(COMPANY.urgencyPhone)}<br/>
      ✉️ ${escapeHtml(COMPANY.email)}<br/>
      📍 ${escapeHtml(COMPANY.address)}<br/>
      CNPJ ${escapeHtml(COMPANY.cnpj)}
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
}) {
  const ageText = data.age != null ? `${data.age} anos` : "—";
  const body = `
    <p>Olá, <strong>${escapeHtml(data.studentName)}</strong>!</p>
    <p>Sua matrícula na <strong>${escapeHtml(COMPANY.name)}</strong> foi recebida com sucesso. Aqui está o resumo:</p>
    <ul style="padding-left:18px;">
      <li><strong>Aluno:</strong> ${escapeHtml(data.studentName)} · ${escapeHtml(ageText)}</li>
      <li><strong>Curso(s):</strong> ${escapeHtml(data.coursesText)}</li>
      <li><strong>Modalidade:</strong> ${escapeHtml(data.modality)}</li>
      <li><strong>Plano:</strong> ${escapeHtml(data.plan)} — ${escapeHtml(data.planDetail)}</li>
      <li><strong>Forma de pagamento:</strong> ${escapeHtml(data.paymentMethod)}</li>
      <li><strong>Taxa de matrícula:</strong> ${escapeHtml(formatBRL(data.enrollmentFee))}</li>
      <li><strong>Rematrícula automática:</strong> ${data.autoRenew ? "Sim" : "Não"}</li>
    </ul>
    <p>Próximo passo: envie o resumo da sua matrícula pelo WhatsApp da nossa equipe para confirmarmos tudo certinho.</p>
    <p>Bem-vindo(a) à ${escapeHtml(COMPANY.name)}! 🎉</p>
  `;
  return layout("Matrícula confirmada", body);
}

export function abandonmentEmailHtml(data: {
  fullName?: string | null;
  age?: number | null;
  email?: string | null;
  phone?: string | null;
  grade?: string | null;
  school?: string | null;
  coursesText?: string;
  currentStep: number;
  lastActivityAt: string;
}) {
  const body = `
    <p>Olá, equipe ${escapeHtml(COMPANY.name)}!</p>
    <p>Uma matrícula ficou parada há mais de 1 hora e pode ter sido abandonada. Segue o que já foi preenchido:</p>
    <ul style="padding-left:18px;">
      <li><strong>Nome:</strong> ${escapeHtml(data.fullName || "não preenchido")}</li>
      <li><strong>Idade:</strong> ${data.age != null ? data.age : "—"}</li>
      <li><strong>E-mail:</strong> ${escapeHtml(data.email || "—")}</li>
      <li><strong>Telefone/WhatsApp:</strong> ${escapeHtml(data.phone || "—")}</li>
      <li><strong>Série:</strong> ${escapeHtml(data.grade || "—")}</li>
      <li><strong>Onde estuda:</strong> ${escapeHtml(data.school || "—")}</li>
      <li><strong>Curso(s) em andamento:</strong> ${escapeHtml(data.coursesText || "—")}</li>
      <li><strong>Último passo preenchido:</strong> Passo ${data.currentStep} de 9</li>
      <li><strong>Parou às:</strong> ${escapeHtml(data.lastActivityAt)}</li>
    </ul>
    <p>Se quiser, dá pra chamar no WhatsApp/e-mail cadastrado e ajudar a concluir a matrícula.</p>
  `;
  return layout("Matrícula não finalizada", body);
}
