import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import {
  adminSettings,
  classes,
  enrollmentCourses,
  enrollments,
  guardians,
  referrals,
  scholarshipCodes,
  students,
  waitlist,
} from "./db/schema";
import type { EnrollmentDraft } from "./validation";
import { brDateToIso, calcAge, onlyDigits } from "./validation";
import {
  calculatePricing,
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  isApmfSchool,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "./pricing";
import type { Subject } from "./courses";
import { getClassByCode, SUBJECT_LABELS } from "./courses";
import {
  confirmationEmailHtml,
  duplicateAlertHtml,
  otpEmailHtml,
} from "./email/templates";
import { sendEmail } from "./email/send";
import { COMPANY } from "./company";
import {
  generateOtpCode,
  generateReferralCode,
  OBLIGATION_DEADLINE_DAYS,
  OTP_TTL_MINUTES,
  seedClassRows,
} from "./v2-helpers";
import {
  buildAccessSet,
  ensureAccessSchema,
  ensureEnrollmentAccesses,
  nextEnrollmentNumber,
  type AccessSet,
} from "./access";

// Reconciliação do catálogo de turmas é cara (N updates) e os horários só mudam
// em deploy — então rodamos no máximo UMA vez por isolate. As leituras de vagas
// (seatsTaken) continuam sempre frescas via getClassesAvailability().
let classesReconciled = false;

export async function ensureClassesSeeded() {
  if (classesReconciled) return;
  const db = getDb();

  const existing = await db.select({ id: classes.id }).from(classes).limit(1);
  if (existing.length === 0) {
    await db.insert(classes).values(seedClassRows());
    classesReconciled = true;
    return;
  }

  // Mantém horários do catálogo sincronizados (ex.: R1/R2) — uma vez por isolate.
  for (const row of seedClassRows()) {
    await db
      .update(classes)
      .set({
        weekday: row.weekday,
        schedule: row.schedule,
        subject: row.subject,
        gradeRange: row.gradeRange,
        updatedAt: new Date(),
      })
      .where(eq(classes.code, row.code));
  }
  classesReconciled = true;
}

export async function getClassesAvailability() {
  await ensureClassesSeeded();
  const db = getDb();
  return db.select().from(classes);
}

export async function createEnrollmentSession() {
  const db = getDb();
  await ensureClassesSeeded();
  const token = nanoid(32);

  const [student] = await db.insert(students).values({}).returning();
  const [enrollment] = await db
    .insert(enrollments)
    .values({
      studentId: student.id,
      sessionToken: token,
      status: "em_andamento",
      currentStep: 1,
      draftData: JSON.stringify({}),
    })
    .returning();

  return { token, enrollmentId: enrollment.id, studentId: student.id };
}

export async function getEnrollmentByToken(token: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.sessionToken, token))
    .limit(1);
  return row ?? null;
}

export async function getEnrollmentByEditToken(editToken: string) {
  const db = getDb();
  const [row] = await db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.editToken, editToken))
    .limit(1);
  return row ?? null;
}

export async function patchEnrollment(
  token: string,
  input: { currentStep?: number; draft?: EnrollmentDraft }
) {
  const db = getDb();
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) return null;
  if (enrollment.status === "concluida" || enrollment.status === "alerta_duplicidade") {
    return enrollment;
  }

  const draft: EnrollmentDraft = {
    ...(enrollment.draftData
      ? (JSON.parse(enrollment.draftData) as EnrollmentDraft)
      : {}),
    ...input.draft,
  };

  if (enrollment.studentId) {
    await db
      .update(students)
      .set({
        fullName: draft.fullName || null,
        birthDate: draft.birthDateBr ? brDateToIso(draft.birthDateBr) : null,
        email: draft.email || null,
        phone: draft.phone || null,
        grade: draft.grade || null,
        school: draft.school || null,
        cpf: draft.cpf || null,
        rg: draft.rg || null,
        address: draft.address || null,
        referralSource: draft.referralSource || null,
        lgpdConsent: draft.lgpdConsent ?? false,
      })
      .where(eq(students.id, enrollment.studentId));
  }

  if (enrollment.studentId) {
    const [existingGuardian] = await db
      .select()
      .from(guardians)
      .where(eq(guardians.studentId, enrollment.studentId))
      .limit(1);

    const guardianValues = {
      fatherName: draft.fatherName || null,
      fatherPhone: draft.fatherPhone || null,
      motherName: draft.motherName || null,
      motherPhone: draft.motherPhone || null,
    };

    if (existingGuardian) {
      await db
        .update(guardians)
        .set(guardianValues)
        .where(eq(guardians.id, existingGuardian.id));
    } else if (
      draft.fatherName ||
      draft.fatherPhone ||
      draft.motherName ||
      draft.motherPhone
    ) {
      await db.insert(guardians).values({
        studentId: enrollment.studentId,
        ...guardianValues,
      });
    }
  }

  if (draft.courses) {
    const availability = await getClassesAvailability();
    const byCode = Object.fromEntries(availability.map((c) => [c.code, c]));

    await db
      .delete(enrollmentCourses)
      .where(eq(enrollmentCourses.enrollmentId, enrollment.id));

    if (draft.courses.length) {
      await db.insert(enrollmentCourses).values(
        draft.courses.map((c) => {
          const cls = byCode[c.classCode];
          const full = cls ? cls.seatsTaken >= cls.maxSeats : false;
          return {
            enrollmentId: enrollment.id,
            subject: c.subject,
            classCode: c.classCode,
            onWaitlist: full || Boolean(draft.waitlistCodes?.includes(c.classCode)),
          };
        })
      );
    }
  }

  const [updated] = await db
    .update(enrollments)
    .set({
      currentStep: input.currentStep ?? enrollment.currentStep,
      modality: draft.modality ?? enrollment.modality,
      plan: draft.plan ?? enrollment.plan,
      paymentMethod: draft.paymentMethod ?? enrollment.paymentMethod,
      autoRenew: draft.autoRenew ?? enrollment.autoRenew,
      courseInfoAck: draft.courseInfoAck ?? enrollment.courseInfoAck,
      referralCodeUsed: draft.referralCodeInput?.trim() || enrollment.referralCodeUsed,
      draftData: JSON.stringify(draft),
      lastActivityAt: new Date(),
      // se e-mail mudou, invalida verificação
      emailVerified:
        draft.email &&
        enrollment.draftData &&
        (JSON.parse(enrollment.draftData) as EnrollmentDraft).email !== draft.email
          ? false
          : enrollment.emailVerified,
    })
    .where(eq(enrollments.id, enrollment.id))
    .returning();

  return updated;
}

export async function sendEnrollmentOtp(token: string) {
  const db = getDb();
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) throw new Error("NOT_FOUND");

  const draft: EnrollmentDraft = enrollment.draftData
    ? (JSON.parse(enrollment.draftData) as EnrollmentDraft)
    : {};
  if (!draft.email) throw new Error("EMAIL_AUSENTE");

  const code = generateOtpCode();
  const expires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const sent = await sendEmail({
    to: draft.email,
    subject: `Seu código de verificação — ${COMPANY.name}`,
    html: otpEmailHtml(code, draft.fullName),
  });

  if (sent.skipped) {
    throw new Error("EMAIL_NAO_CONFIGURADO");
  }
  if ("error" in sent && sent.error) {
    if (sent.code === "sandbox") throw new Error("EMAIL_DOMINIO");
    throw new Error("EMAIL_FALHOU");
  }

  // Só grava o OTP depois que o e-mail saiu — evita código órfão.
  await db
    .update(enrollments)
    .set({
      emailOtpCode: code,
      emailOtpExpiresAt: expires,
      emailVerified: false,
      lastActivityAt: new Date(),
    })
    .where(eq(enrollments.id, enrollment.id));

  return {
    ok: true,
    expiresAt: expires.toISOString(),
    sentTo: draft.email,
  };
}

export async function verifyEnrollmentOtp(token: string, code: string) {
  const db = getDb();
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) throw new Error("NOT_FOUND");
  if (!enrollment.emailOtpCode || !enrollment.emailOtpExpiresAt) {
    throw new Error("OTP_NAO_ENVIADO");
  }
  if (new Date(enrollment.emailOtpExpiresAt) < new Date()) {
    throw new Error("OTP_EXPIRADO");
  }
  if (enrollment.emailOtpCode !== code.trim()) {
    throw new Error("OTP_INVALIDO");
  }

  await db
    .update(enrollments)
    .set({
      emailVerified: true,
      emailOtpCode: null,
      emailOtpExpiresAt: null,
      lastActivityAt: new Date(),
    })
    .where(eq(enrollments.id, enrollment.id));

  return { ok: true };
}

/** Verificação alternativa quando o envio de e-mail está bloqueado (sandbox Resend). */
export async function verifyEnrollmentByPhoneTail(
  token: string,
  phoneTail: string
) {
  const db = getDb();
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) throw new Error("NOT_FOUND");

  const draft: EnrollmentDraft = enrollment.draftData
    ? (JSON.parse(enrollment.draftData) as EnrollmentDraft)
    : {};
  const phone = onlyDigits(draft.phone || "");
  const tail = onlyDigits(phoneTail);
  if (tail.length !== 4) throw new Error("TELEFONE_INVALIDO");
  if (!phone || !phone.endsWith(tail)) throw new Error("TELEFONE_INVALIDO");

  await db
    .update(enrollments)
    .set({
      emailVerified: true,
      emailOtpCode: null,
      emailOtpExpiresAt: null,
      lastActivityAt: new Date(),
    })
    .where(eq(enrollments.id, enrollment.id));

  return { ok: true, method: "phone_tail" as const };
}

async function findDuplicate(
  draft: EnrollmentDraft,
  classCodes: string[],
  currentEnrollmentId: string
) {
  const db = getDb();
  const email = draft.email?.trim().toLowerCase();
  const phone = draft.phone ? onlyDigits(draft.phone) : "";
  const cpf = draft.cpf ? onlyDigits(draft.cpf) : "";

  const completed = await db
    .select({
      enrollment: enrollments,
      student: students,
      course: enrollmentCourses,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(
      enrollmentCourses,
      eq(enrollmentCourses.enrollmentId, enrollments.id)
    )
    .where(
      and(
        inArray(enrollments.status, ["concluida", "alerta_duplicidade"]),
        ne(enrollments.id, currentEnrollmentId),
        inArray(enrollmentCourses.classCode, classCodes),
        eq(enrollmentCourses.onWaitlist, false)
      )
    );

  return completed.filter((row) => {
    const s = row.student;
    if (email && s.email?.trim().toLowerCase() === email) return true;
    if (phone && s.phone && onlyDigits(s.phone) === phone) return true;
    if (cpf && s.cpf && onlyDigits(s.cpf) === cpf) return true;
    return false;
  });
}

export async function completeEnrollment(
  token: string,
  opts: {
    declarationName: string;
    ip: string;
    confirmEmail: string;
    confirmPhone: string;
  }
) {
  const db = getDb();
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) throw new Error("NOT_FOUND");
  if (enrollment.status === "concluida") {
    return { alreadyCompleted: true as const, enrollment };
  }

  if (!enrollment.emailVerified) throw new Error("EMAIL_NAO_VERIFICADO");

  const draft: EnrollmentDraft = enrollment.draftData
    ? (JSON.parse(enrollment.draftData) as EnrollmentDraft)
    : {};

  // ── Bolsa 100% — NUNCA confie no cliente. ────────────────────────────────
  // `scholarshipValid`, `waivedFee` e `paymentMethod: "isento"` chegam do
  // navegador e zerariam toda a cobrança em calculatePricing(). Revalidamos o
  // código de bolsa no banco: só isenta se existir um código real ainda não
  // usado (ou já usado por ESTA matrícula, para reconclusões idempotentes).
  let scholarshipApproved = false;
  const scholarshipCodeInput = draft.scholarshipCode?.trim().toUpperCase();
  if (scholarshipCodeInput) {
    const [bolsa] = await db
      .select()
      .from(scholarshipCodes)
      .where(eq(scholarshipCodes.code, scholarshipCodeInput))
      .limit(1);
    if (bolsa && (!bolsa.usedAt || bolsa.usedByEnrollmentId === enrollment.id)) {
      scholarshipApproved = true;
    }
  }

  draft.scholarshipValid = scholarshipApproved;
  draft.waivedFee = scholarshipApproved;
  if (scholarshipApproved) {
    draft.paymentMethod = "isento";
  } else if (draft.paymentMethod === "isento") {
    // Tentativa de isenção sem bolsa válida — bloqueia a matrícula grátis.
    throw new Error("BOLSA_INVALIDA");
  }

  if (!draft.fullName || !draft.birthDateBr || !draft.email || !draft.phone) {
    throw new Error("DADOS_INCOMPLETOS");
  }
  if (!draft.instagram?.trim()) {
    throw new Error("DADOS_INCOMPLETOS");
  }
  if (!draft.courses?.length || !draft.modality || !draft.plan || !draft.paymentMethod) {
    throw new Error("DADOS_INCOMPLETOS");
  }
  if (draft.modality === "apmf" && !isApmfSchool(draft.school)) {
    throw new Error("APMF_ESCOLA_INVALIDA");
  }
  if (!draft.courseInfoAck || !draft.noticePayment || !draft.noticeAbsence || !draft.noticeModality) {
    throw new Error("AVISOS_PENDENTES");
  }
  if (
    (draft.modality === "desconto" ||
      draft.modality === "desconto_parcial" ||
      draft.modality === "apmf") &&
    (!draft.modalityDutyAck ||
      !draft.modalityDutyFollowedIg ||
      !(draft.modalityDutySignature && draft.modalityDutySignature.trim().length >= 3))
  ) {
    throw new Error("AVISOS_PENDENTES");
  }
  if (
    opts.confirmEmail.trim().toLowerCase() !== draft.email.trim().toLowerCase() ||
    onlyDigits(opts.confirmPhone) !== onlyDigits(draft.phone)
  ) {
    throw new Error("CONFIRMACAO_INVALIDA");
  }

  const age = calcAge(brDateToIso(draft.birthDateBr)!);
  if (age !== null && age < 18) {
    const fatherOk = draft.fatherName?.trim() && draft.fatherPhone;
    const motherOk = draft.motherName?.trim() && draft.motherPhone;
    if (!fatherOk && !motherOk) throw new Error("RESPONSAVEIS_PENDENTES");
  }

  const classCodes = draft.courses.map((c) => c.classCode);
  const duplicates = await findDuplicate(draft, classCodes, enrollment.id);
  if (duplicates.length > 0) {
    await db
      .update(enrollments)
      .set({
        status: "alerta_duplicidade",
        declarationName: opts.declarationName,
        declarationIp: opts.ip,
        declarationAt: new Date(),
        lastActivityAt: new Date(),
        draftData: JSON.stringify(draft),
      })
      .where(eq(enrollments.id, enrollment.id));

    const companyEmail = process.env.COMPANY_EMAIL || COMPANY.email;
    await sendEmail({
      to: companyEmail,
      subject: `⚠️ Alerta de duplicidade — ${draft.fullName}`,
      html: duplicateAlertHtml({
        fullName: draft.fullName ?? "",
        email: draft.email ?? "",
        phone: draft.phone ?? "",
        classCodes,
      }),
    });

    throw new Error("DUPLICIDADE");
  }

  await ensureClassesSeeded();
  const waitlistCodes: string[] = [];
  const enrolledCodes: string[] = [];

  // Reserva de vaga ATÔMICA: incrementa seatsTaken apenas se ainda houver vaga
  // (WHERE seatsTaken < maxSeats). Isso evita corrida entre matrículas simultâneas
  // que veriam a mesma "última vaga" e estourariam o limite da turma.
  for (const c of draft.courses) {
    const claimed = await db
      .update(classes)
      .set({
        seatsTaken: sql`${classes.seatsTaken} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(classes.code, c.classCode),
          sql`${classes.seatsTaken} < ${classes.maxSeats}`
        )
      )
      .returning({ code: classes.code });

    if (claimed.length > 0) {
      enrolledCodes.push(c.classCode);
    } else {
      waitlistCodes.push(c.classCode);
    }
  }

  const subjects = draft.courses
    .filter((c) => enrolledCodes.includes(c.classCode))
    .map((c) => c.subject as Subject);

  // Se tudo foi pra lista de espera, ainda assim conclui com status especial? 
  // Mantém pricing com todos os cursos selecionados (negócio: lista de espera não paga ainda da mesma forma — usa todos)
  const pricingSubjects =
    subjects.length > 0
      ? subjects
      : draft.courses.map((c) => c.subject as Subject);

  const pricing = calculatePricing({
    modality: draft.modality as Modality,
    plan: draft.plan as Plan,
    paymentMethod: draft.paymentMethod as PaymentMethod,
    subjects: pricingSubjects,
    waivedFee: draft.waivedFee,
    scholarship: draft.scholarshipValid === true,
  });

  const editToken = nanoid(40);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + OBLIGATION_DEADLINE_DAYS);
  const deadlineStr = deadline.toISOString().slice(0, 10);

  const needsObligation =
    draft.modality === "desconto" ||
    draft.modality === "desconto_parcial" ||
    draft.modality === "apmf";

  await db
    .update(students)
    .set({
      fullName: draft.fullName,
      birthDate: brDateToIso(draft.birthDateBr),
      email: draft.email,
      phone: draft.phone,
      grade: draft.grade!,
      school: draft.school!,
      cpf: draft.cpf || null,
      rg: draft.rg || null,
      address: draft.address || null,
      referralSource: draft.referralSource || null,
      lgpdConsent: true,
    })
    .where(eq(students.id, enrollment.studentId!));

  // Lista de espera
  for (const code of waitlistCodes) {
    await db.insert(waitlist).values({
      classCode: code,
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      fullName: draft.fullName,
      email: draft.email,
      phone: draft.phone,
    });
  }

  await db
    .delete(enrollmentCourses)
    .where(eq(enrollmentCourses.enrollmentId, enrollment.id));
  await db.insert(enrollmentCourses).values(
    draft.courses.map((c) => ({
      enrollmentId: enrollment.id,
      subject: c.subject,
      classCode: c.classCode,
      onWaitlist: waitlistCodes.includes(c.classCode),
    }))
  );

  // Código de indicação usado
  if (draft.referralCodeInput?.trim()) {
    const code = draft.referralCodeInput.trim().toUpperCase();
    const [ref] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.code, code))
      .limit(1);
    if (ref && !ref.referredEnrollmentId) {
      await db
        .update(referrals)
        .set({ referredEnrollmentId: enrollment.id })
        .where(eq(referrals.id, ref.id));
    }
  }

  // Código de bolsa (uso único)
  if (draft.scholarshipValid && draft.scholarshipCode?.trim()) {
    const bolsa = draft.scholarshipCode.trim().toUpperCase();
    const [row] = await db
      .select()
      .from(scholarshipCodes)
      .where(eq(scholarshipCodes.code, bolsa))
      .limit(1);
    if (row && !row.usedAt) {
      await db
        .update(scholarshipCodes)
        .set({
          usedAt: new Date(),
          usedByEnrollmentId: enrollment.id,
          usedByStudentName: draft.fullName,
        })
        .where(eq(scholarshipCodes.id, row.id));
    }
  }

  // Gera código se modalidade 1
  let referralCode: string | null = null;
  if (draft.modality === "desconto") {
    referralCode = generateReferralCode(draft.fullName);
    await db.insert(referrals).values({
      referrerEnrollmentId: enrollment.id,
      code: referralCode,
    });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://rnm-matricula.jmdias2901.workers.dev";
  const editUrl = `${appUrl}/editar/${editToken}`;

  // ── Número de matrícula (R0001+) e acessos gerados ────────────────────────
  await ensureAccessSchema();
  const enrollmentNumber =
    enrollment.enrollmentNumber || (await nextEnrollmentNumber());
  const principalName =
    (draft.principalGuardian === "mae"
      ? draft.motherName || draft.fatherName
      : draft.fatherName || draft.motherName) || draft.fullName;
  const accessSet: AccessSet = buildAccessSet({
    enrollmentNumber,
    studentName: draft.fullName,
    principalName,
  });

  const [updated] = await db
    .update(enrollments)
    .set({
      status: "concluida",
      currentStep: 10,
      enrollmentNumber,
      modality: draft.modality,
      plan: draft.plan,
      paymentMethod: draft.paymentMethod,
      autoRenew: draft.plan === "mensal" ? Boolean(draft.autoRenew) : false,
      monthlyValue: String(pricing.monthlyValue),
      planTotal: String(pricing.planTotal),
      enrollmentFee: String(pricing.enrollmentFee),
      declarationName: opts.declarationName,
      declarationIp: opts.ip,
      declarationAt: new Date(),
      completedAt: new Date(),
      lastActivityAt: new Date(),
      editToken,
      obligationStatus: needsObligation ? "pendente" : "cumprida",
      obligationDeadline: needsObligation ? deadlineStr : null,
      referralCodeUsed: draft.referralCodeInput?.trim().toUpperCase() || null,
      draftData: JSON.stringify(draft),
    })
    .where(eq(enrollments.id, enrollment.id))
    .returning();

  // Grava os acessos (idempotente — não sobrescreve se já existirem).
  await ensureEnrollmentAccesses(enrollment.id, accessSet);

  const coursesText = draft.courses
    .map((c) => {
      const info = getClassByCode(c.classCode);
      const label = SUBJECT_LABELS[c.subject];
      const wl = waitlistCodes.includes(c.classCode) ? " (lista de espera)" : "";
      return `${label} — Turma ${c.classCode}${info ? ` · ${info.day} das ${info.schedule}` : ""}${wl}`;
    })
    .join("; ");

  const invoicePayload =
    draft.needsInvoice === true
      ? {
          name: (draft.invoiceName || "").trim(),
          cpf: (draft.invoiceCpf || "").trim(),
          address: (draft.invoiceAddress || "").trim(),
          phone: (draft.invoicePhone || "").trim(),
          notes: (draft.invoiceNotes || "").trim() || undefined,
        }
      : null;

  const html = confirmationEmailHtml({
    studentName: draft.fullName,
    age,
    coursesText,
    modality: MODALITY_LABELS[draft.modality as Modality],
    plan: PLAN_LABELS[draft.plan as Plan],
    planDetail: pricing.calculationLabel,
    paymentMethod: draft.scholarshipValid
      ? "Isento — bolsa integral (100%)"
      : PAYMENT_LABELS[draft.paymentMethod as PaymentMethod],
    enrollmentFee: pricing.enrollmentFee,
    planTotal: pricing.planTotal,
    scholarship: draft.scholarshipValid === true,
    autoRenew: draft.plan === "mensal" ? Boolean(draft.autoRenew) : false,
    referralCode,
    editUrl,
    invoice: invoicePayload,
    enrollmentNumber,
    accesses: accessSet,
  });

  const subject = `✅ Matrícula confirmada — ${enrollmentNumber} · ${draft.fullName} | ${COMPANY.name}`;
  const companyEmail = process.env.COMPANY_EMAIL || COMPANY.email;

  await Promise.all([
    sendEmail({ to: draft.email, subject, html }),
    sendEmail({ to: companyEmail, subject, html }),
  ]);

  return {
    alreadyCompleted: false as const,
    enrollment: updated,
    pricing,
    draft,
    referralCode,
    editUrl,
    enrollmentNumber,
    accesses: accessSet,
    waitlistCodes,
    whatsapp: {
      fullName: draft.fullName,
      phone: draft.phone,
      email: draft.email,
      courses: draft.courses,
      modality: draft.modality as Modality,
      plan: draft.plan as Plan,
      paymentMethod: draft.paymentMethod as PaymentMethod,
      planTotal: pricing.planTotal,
      enrollmentFee: pricing.enrollmentFee,
      scholarship: draft.scholarshipValid === true,
      invoice: invoicePayload,
    },
  };
}

export async function updateContactByEditToken(
  editToken: string,
  data: { email?: string; phone?: string }
) {
  const row = await getEnrollmentByEditToken(editToken);
  if (!row || row.enrollment.status !== "concluida") throw new Error("NOT_FOUND");
  if (!row.student) throw new Error("NOT_FOUND");

  const db = getDb();
  await db
    .update(students)
    .set({
      email: data.email?.trim() || row.student.email,
      phone: data.phone?.trim() || row.student.phone,
    })
    .where(eq(students.id, row.student.id));

  return { ok: true };
}

export async function getCardFeePercent(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "card_machine_fee_percent"))
    .limit(1);
  return row
    ? Number(row.value)
    : Number(process.env.DEFAULT_CARD_FEE_PERCENT || 3.5);
}

/**
 * Secretaria troca a turma do aluno na mesma matéria.
 * Libera a vaga da turma antiga (se tinha) e ocupa a nova.
 * Se a nova estiver lotada, ainda assim coloca o aluno (força a vaga).
 */
export async function adminChangeEnrollmentClass(input: {
  enrollmentId: string;
  subject: string;
  newClassCode: string;
}): Promise<{
  classCode: string;
  onWaitlist: boolean;
  forcedSeat: boolean;
  previousClassCode: string;
}> {
  const { enrollmentId, subject, newClassCode } = input;
  const info = getClassByCode(newClassCode);
  if (!info) throw new Error("TURMA_INVALIDA");
  if (info.subject !== subject) throw new Error("MATERIA_DIFERENTE");

  const db = getDb();
  await ensureClassesSeeded();

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) throw new Error("NOT_FOUND");

  const [current] = await db
    .select()
    .from(enrollmentCourses)
    .where(
      and(
        eq(enrollmentCourses.enrollmentId, enrollmentId),
        eq(enrollmentCourses.subject, subject)
      )
    )
    .limit(1);

  if (!current) throw new Error("CURSO_NAO_ENCONTRADO");
  if (current.classCode === newClassCode) {
    return {
      classCode: newClassCode,
      onWaitlist: Boolean(current.onWaitlist),
      forcedSeat: false,
      previousClassCode: current.classCode,
    };
  }

  const previousClassCode = current.classCode;
  const wasEnrolled = !current.onWaitlist;

  // Libera vaga da turma antiga, se o aluno ocupava uma.
  if (wasEnrolled) {
    await db
      .update(classes)
      .set({
        seatsTaken: sql`GREATEST(${classes.seatsTaken} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(classes.code, previousClassCode));
  }

  // Remove da lista de espera da turma antiga (se estava).
  await db
    .delete(waitlist)
    .where(
      and(
        eq(waitlist.enrollmentId, enrollmentId),
        eq(waitlist.classCode, previousClassCode)
      )
    );

  // Tenta vaga normal; se lotada, força (secretaria).
  let forcedSeat = false;
  const claimed = await db
    .update(classes)
    .set({
      seatsTaken: sql`${classes.seatsTaken} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(classes.code, newClassCode),
        sql`${classes.seatsTaken} < ${classes.maxSeats}`
      )
    )
    .returning({ code: classes.code });

  if (claimed.length === 0) {
    forcedSeat = true;
    await db
      .update(classes)
      .set({
        seatsTaken: sql`${classes.seatsTaken} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(classes.code, newClassCode));
  }

  // Não fica em lista de espera ao trocar pela secretaria.
  await db
    .delete(waitlist)
    .where(
      and(
        eq(waitlist.enrollmentId, enrollmentId),
        eq(waitlist.classCode, newClassCode)
      )
    );

  await db
    .update(enrollmentCourses)
    .set({ classCode: newClassCode, onWaitlist: false })
    .where(eq(enrollmentCourses.id, current.id));

  // Mantém o rascunho alinhado, se existir.
  if (enrollment.draftData) {
    try {
      const draft = JSON.parse(enrollment.draftData) as EnrollmentDraft;
      if (Array.isArray(draft.courses)) {
        draft.courses = draft.courses.map((c) =>
          c.subject === subject ? { ...c, classCode: newClassCode } : c
        );
      }
      if (Array.isArray(draft.waitlistCodes)) {
        draft.waitlistCodes = draft.waitlistCodes.filter(
          (code) => code !== previousClassCode && code !== newClassCode
        );
      }
      await db
        .update(enrollments)
        .set({
          draftData: JSON.stringify(draft),
          lastActivityAt: new Date(),
        })
        .where(eq(enrollments.id, enrollmentId));
    } catch {
      await db
        .update(enrollments)
        .set({ lastActivityAt: new Date() })
        .where(eq(enrollments.id, enrollmentId));
    }
  } else {
    await db
      .update(enrollments)
      .set({ lastActivityAt: new Date() })
      .where(eq(enrollments.id, enrollmentId));
  }

  return {
    classCode: newClassCode,
    onWaitlist: false,
    forcedSeat,
    previousClassCode,
  };
}

