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
<body style="margin:0;background:#f7f8fa;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#14213d;">
  <div style="max-width:560px;margin:28px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(20,33,61,.10);border:1px solid #e4e7ec;">
    <div style="background:linear-gradient(135deg,#14213d,#0d1730);padding:28px 32px;">
      <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#f2b705;font-weight:700;">${escapeHtml(COMPANY.name)}</p>
      <h1 style="margin:10px 0 0;font-size:22px;color:#fff;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(title)}</h1>
    </div>
    <div style="padding:28px 32px;font-size:15px;line-height:1.65;color:#35415c;">${body}</div>
    <div style="padding:18px 32px 24px;background:#f2f5fb;font-size:12px;color:#6b7385;line-height:1.55;border-top:1px solid #e4e7ec;">
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
  planTotal?: number;
  scholarship?: boolean;
  autoRenew: boolean;
  referralCode?: string | null;
  editUrl?: string;
  invoice?: {
    name: string;
    cpf: string;
    address: string;
    phone: string;
    notes?: string;
  } | null;
  enrollmentNumber?: string | null;
  accesses?: {
    sistemaLogin: string;
    sistemaPassword: string;
    responsavelLogin: string;
    responsavelPassword: string;
    sofiaLogin: string;
    sofiaPassword: string;
    correcaoLogin: string;
    correcaoPassword: string;
  } | null;
}) {
  const ageText = data.age != null ? `${data.age} anos` : "—";
  const referralBlock = data.referralCode
    ? `<li><strong>Seu código de indicação:</strong> <code style="background:#fef3cd;padding:2px 8px;border-radius:6px;color:#b8890a;font-weight:700;">${escapeHtml(data.referralCode)}</code> — compartilhe com quem você for indicar!</li>`
    : "";
  const editBlock = data.editUrl
    ? `<p style="margin-top:18px;">Quer atualizar telefone ou e-mail? <a href="${escapeHtml(data.editUrl)}" style="color:#14213d;font-weight:700;">Editar dados básicos</a></p>`
    : "";
  const renewLine = data.autoRenew
    ? `<li><strong>Rematrícula automática:</strong> Sim</li>`
    : "";
  const feeText =
    data.scholarship || data.enrollmentFee <= 0
      ? "isenta"
      : formatBRL(data.enrollmentFee);
  const planTotalText =
    data.scholarship || (data.planTotal != null && data.planTotal <= 0)
      ? "R$ 0,00 (bolsa integral)"
      : data.planTotal != null
        ? formatBRL(data.planTotal)
        : null;
  const invoiceBlock = data.invoice
    ? `<li><strong>Nota fiscal (responsável):</strong> Sim
        <ul style="margin:6px 0 0;padding-left:18px;">
          <li>Nome: ${escapeHtml(data.invoice.name)}</li>
          <li>CPF: ${escapeHtml(data.invoice.cpf)}</li>
          <li>Endereço: ${escapeHtml(data.invoice.address)}</li>
          <li>Telefone: ${escapeHtml(data.invoice.phone)}</li>
          ${
            data.invoice.notes?.trim()
              ? `<li>Obs.: ${escapeHtml(data.invoice.notes.trim())}</li>`
              : ""
          }
        </ul>
      </li>`
    : "";
  const numberBlock = data.enrollmentNumber
    ? `<div style="margin:18px 0;padding:16px 20px;border-radius:14px;background:linear-gradient(135deg,#14213d,#0d1730);text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#f2b705;font-weight:700;">Número de matrícula</p>
        <p style="margin:0;font-size:30px;letter-spacing:.14em;font-weight:800;color:#fff;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(data.enrollmentNumber)}</p>
      </div>`
    : "";

  const accessRow = (
    label: string,
    login: string,
    senha: string,
    hint?: string
  ) =>
    `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e4e7ec;vertical-align:top;">
        <strong style="color:#14213d;">${escapeHtml(label)}</strong>
        ${hint ? `<br/><span style="font-size:12px;color:#6b7385;">${escapeHtml(hint)}</span>` : ""}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#35415c;">
        <span style="color:#6b7385;">usuário:</span> ${escapeHtml(login)}<br/>
        <span style="color:#6b7385;">senha:</span> <strong>${escapeHtml(senha)}</strong>
      </td>
    </tr>`;

  const accessBlock = data.accesses
    ? `<div style="margin:20px 0;padding:2px 0;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#14213d;">🔐 Seus acessos</p>
        <p style="margin:0 0 12px;font-size:13px;color:#6b7385;">Guarde estes dados. Recomendamos trocar as senhas no primeiro acesso.</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden;">
          ${accessRow("Sistema (aluno)", data.accesses.sistemaLogin, data.accesses.sistemaPassword, "Usuário = número de matrícula")}
          ${accessRow("Responsável", data.accesses.responsavelLogin, data.accesses.responsavelPassword)}
          ${accessRow("Sofia", data.accesses.sofiaLogin, data.accesses.sofiaPassword)}
          ${accessRow("Correção", data.accesses.correcaoLogin, data.accesses.correcaoPassword)}
        </table>
      </div>`
    : "";

  const body = `
    <p>Olá, <strong style="color:#14213d;">${escapeHtml(data.studentName)}</strong>!</p>
    <p>Sua matrícula na <strong>${escapeHtml(COMPANY.name)}</strong> foi recebida. Resumo:</p>
    ${numberBlock}
    <ul style="padding-left:18px;margin:16px 0;">
      <li><strong>Aluno:</strong> ${escapeHtml(data.studentName)} · ${escapeHtml(ageText)}</li>
      <li><strong>Curso(s):</strong> ${escapeHtml(data.coursesText)}</li>
      <li><strong>Modalidade:</strong> ${escapeHtml(data.modality)}</li>
      <li><strong>Plano:</strong> ${escapeHtml(data.plan)} — ${escapeHtml(data.planDetail)}</li>
      <li><strong>Pagamento:</strong> ${escapeHtml(data.paymentMethod)}</li>
      ${planTotalText ? `<li><strong>Valor do plano:</strong> ${escapeHtml(planTotalText)}</li>` : ""}
      <li><strong>Taxa de matrícula:</strong> ${escapeHtml(feeText)}</li>
      ${invoiceBlock}
      ${renewLine}
      ${referralBlock}
    </ul>
    ${accessBlock}
    <p>Próximo passo: envie o resumo pelo WhatsApp da equipe para confirmarmos tudo.</p>
    ${editBlock}
    <p style="margin-top:20px;">Bem-vindo(a)! 🎉</p>
  `;
  return layout("Matrícula confirmada", body);
}

export function accessEmailHtml(data: {
  studentName: string;
  enrollmentNumber?: string | null;
  accesses: {
    sistemaLogin: string;
    sistemaPassword: string;
    responsavelLogin: string;
    responsavelPassword: string;
    sofiaLogin: string;
    sofiaPassword: string;
    correcaoLogin: string;
    correcaoPassword: string;
  };
}) {
  const a = data.accesses;
  const numberBlock = data.enrollmentNumber
    ? `<div style="margin:0 0 18px;padding:16px 20px;border-radius:14px;background:linear-gradient(135deg,#14213d,#0d1730);text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#f2b705;font-weight:700;">Número de matrícula</p>
        <p style="margin:0;font-size:30px;letter-spacing:.14em;font-weight:800;color:#fff;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(data.enrollmentNumber)}</p>
      </div>`
    : "";
  const rowHtml = (label: string, login: string, senha: string, hint?: string) =>
    `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e4e7ec;vertical-align:top;">
        <strong style="color:#14213d;">${escapeHtml(label)}</strong>
        ${hint ? `<br/><span style="font-size:12px;color:#6b7385;">${escapeHtml(hint)}</span>` : ""}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#35415c;">
        <span style="color:#6b7385;">usuário:</span> ${escapeHtml(login)}<br/><span style="color:#6b7385;">senha:</span> <strong>${escapeHtml(senha)}</strong>
      </td>
    </tr>`;
  const body = `
    <p>Olá, <strong style="color:#14213d;">${escapeHtml(data.studentName)}</strong>!</p>
    <p>Seguem seus dados de acesso na <strong>${escapeHtml(COMPANY.name)}</strong>:</p>
    ${numberBlock}
    <table role="presentation" width="100%" style="border-collapse:collapse;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden;">
      ${rowHtml("Sistema (aluno)", a.sistemaLogin, a.sistemaPassword, "Usuário = número de matrícula")}
      ${rowHtml("Responsável", a.responsavelLogin, a.responsavelPassword)}
      ${rowHtml("Sofia", a.sofiaLogin, a.sofiaPassword)}
      ${rowHtml("Correção", a.correcaoLogin, a.correcaoPassword)}
    </table>
    <p style="margin-top:16px;font-size:13px;color:#6b7385;">Guarde estes dados. Recomendamos trocar as senhas no primeiro acesso.</p>
  `;
  return layout("Seus acessos", body);
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
    ? `Olá, <strong style="color:#14213d;">${escapeHtml(studentName.trim())}</strong>!`
    : "Olá!";
  const body = `
    <p>${greet}</p>
    <p>Use o código abaixo para confirmar seu e-mail na matrícula da <strong>${escapeHtml(COMPANY.name)}</strong>:</p>
    <div style="margin:28px 0;padding:22px;border-radius:16px;background:linear-gradient(180deg,#fffbef,#fef3cd);text-align:center;border:1px solid #f6dd8f;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#b8890a;font-weight:700;">Código</p>
      <p style="margin:0;font-size:36px;letter-spacing:0.35em;font-weight:800;color:#14213d;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(code)}</p>
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
