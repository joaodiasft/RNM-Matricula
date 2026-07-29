/**
 * Monta a mensagem personalizada de boas-vindas para colar/enviar no WhatsApp.
 * Módulo PURO (sem banco) — usado pelo montador de mensagem do admin.
 *
 * Cada bloco é opcional: a secretaria liga/desliga o que quer incluir.
 */
import { COMPANY } from "./company";
import { SUBJECT_LABELS, getClassByCode, type Subject } from "./courses";
import { CLASS_GROUPS } from "./class-groups";
import { PLATFORM_LINKS, COREDACAO_DEFAULT } from "./platforms";

export type WelcomeCourse = {
  subject: string;
  classCode: string;
  /** Datas do módulo escolhido (já resolvidas). Vazio = não incluir datas. */
  moduleLabel?: string;
  moduleDates?: string[];
  /** Incluir o link do grupo desta turma. */
  includeGroup?: boolean;
};

export type WelcomeAccess = {
  includeSistema: boolean;
  sistemaLogin: string;
  sistemaPassword: string;
  includeSofia: boolean;
  sofiaLogin: string;
  sofiaPassword: string;
  includeCoredacao: boolean;
};

export type WelcomePayment = {
  monthLabel?: string; // "Agosto/2025"
  form?: string; // "PIX"
  paidOnLabel?: string; // "02/08/2025"
  statusLabel?: string; // "Pago" | "Pendente"
  nextDueLabel?: string; // "05/09/2025"
};

export type WelcomeInput = {
  studentName: string;
  greetingName?: string; // primeiro nome (fallback: studentName)
  enrollmentNumber?: string | null;
  modalityLabel?: string | null;
  access?: WelcomeAccess | null;
  courses?: WelcomeCourse[];
  payment?: WelcomePayment | null;
  /** Frase final opcional. */
  closing?: string;
};

function classLine(c: WelcomeCourse): string {
  const info = getClassByCode(c.classCode);
  const subject =
    SUBJECT_LABELS[c.subject as Subject] ?? c.subject;
  const when = info ? ` (${info.day} · ${info.schedule})` : "";
  return `${subject} — Turma ${c.classCode}${when}`;
}

export function buildWelcomeMessage(input: WelcomeInput): string {
  const first = (input.greetingName || input.studentName || "").split(" ")[0];
  const lines: string[] = [];

  lines.push(`Olá${first ? `, ${first}` : ""}! 👋`);
  lines.push(`Seja bem-vindo(a) à *${COMPANY.name}*! Seguem seus dados:`);
  lines.push("");
  lines.push(`👤 *Aluno:* ${input.studentName}`);
  if (input.enrollmentNumber) {
    lines.push(`🎫 *Matrícula:* ${input.enrollmentNumber}`);
  }
  if (input.modalityLabel) {
    lines.push(`🎓 *Modalidade:* ${input.modalityLabel}`);
  }

  // Turmas + datas do módulo
  const courses = input.courses ?? [];
  if (courses.length > 0) {
    lines.push("");
    lines.push("📚 *Turmas e datas*");
    for (const c of courses) {
      lines.push(`• ${classLine(c)}`);
      if (c.moduleDates && c.moduleDates.length > 0) {
        const label = c.moduleLabel ? `${c.moduleLabel}: ` : "Datas: ";
        lines.push(`   🗓️ ${label}${c.moduleDates.join(" · ")}`);
      }
    }
  }

  // Acessos
  const a = input.access;
  if (
    a &&
    (a.includeSistema || a.includeSofia || a.includeCoredacao)
  ) {
    lines.push("");
    lines.push("🔐 *Seus acessos*");

    if (a.includeSistema) {
      lines.push("");
      lines.push("*Sistema (aluno)*");
      lines.push(`🔗 ${PLATFORM_LINKS.sistema}`);
      if (a.sistemaLogin) lines.push(`Login: ${a.sistemaLogin}`);
      if (a.sistemaPassword) lines.push(`Senha: ${a.sistemaPassword}`);
    }

    if (a.includeSofia) {
      lines.push("");
      lines.push("*Plataforma Sofia*");
      lines.push(`🔗 ${PLATFORM_LINKS.sofia}`);
      if (a.sofiaLogin) lines.push(`Login: ${a.sofiaLogin}`);
      if (a.sofiaPassword) lines.push(`Senha: ${a.sofiaPassword}`);
    }

    if (a.includeCoredacao) {
      lines.push("");
      lines.push("*Coredação*");
      lines.push(`🔗 ${PLATFORM_LINKS.coredacao}`);
      lines.push(`Login: ${COREDACAO_DEFAULT.email}`);
      lines.push(`Senha: ${COREDACAO_DEFAULT.password}`);
    }
  }

  // Grupos de WhatsApp
  const groupCourses = courses.filter((c) => c.includeGroup);
  if (groupCourses.length > 0) {
    lines.push("");
    lines.push("💬 *Grupo(s) de avisos no WhatsApp*");
    for (const c of groupCourses) {
      const g = CLASS_GROUPS[c.classCode];
      if (g?.inviteUrl) {
        lines.push(`• ${g.groupName}`);
        lines.push(`   ${g.inviteUrl}`);
      }
    }
    lines.push(
      "_A entrada no grupo é aprovada após a confirmação do pagamento._"
    );
  }

  // Pagamento
  const p = input.payment;
  if (
    p &&
    (p.monthLabel || p.statusLabel || p.form || p.paidOnLabel || p.nextDueLabel)
  ) {
    lines.push("");
    lines.push("💰 *Pagamento*");
    if (p.monthLabel) lines.push(`Mês de referência: ${p.monthLabel}`);
    if (p.statusLabel) lines.push(`Situação: ${p.statusLabel}`);
    if (p.form) lines.push(`Forma: ${p.form}`);
    if (p.paidOnLabel) lines.push(`Pago em: ${p.paidOnLabel}`);
    if (p.nextDueLabel) {
      lines.push(`Próximo vencimento/renovação: ${p.nextDueLabel}`);
    }
  }

  lines.push("");
  lines.push(
    input.closing?.trim() ||
      `Qualquer dúvida, é só chamar aqui. Bons estudos! 🚀\n${COMPANY.name}`
  );

  return lines.join("\n");
}
