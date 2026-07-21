import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import {
  adminSettings,
  enrollmentCourses,
  enrollments,
  guardians,
  students,
} from "./db/schema";
import type { EnrollmentDraft } from "./validation";
import { brDateToIso, calcAge } from "./validation";
import {
  calculatePricing,
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "./pricing";
import type { Subject } from "./courses";
import { getClassByCode, SUBJECT_LABELS } from "./courses";
import { confirmationEmailHtml } from "./email/templates";
import { sendEmail } from "./email/send";
import { COMPANY } from "./company";

export async function createEnrollmentSession() {
  const db = getDb();
  const token = nanoid(32);

  const [student] = await db
    .insert(students)
    .values({})
    .returning();

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

export async function patchEnrollment(
  token: string,
  input: {
    currentStep?: number;
    draft?: EnrollmentDraft;
  }
) {
  const db = getDb();
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) return null;
  if (enrollment.status === "concluida") {
    return enrollment;
  }

  const draft: EnrollmentDraft = {
    ...(enrollment.draftData
      ? (JSON.parse(enrollment.draftData) as EnrollmentDraft)
      : {}),
    ...input.draft,
  };

  if (enrollment.studentId && draft.fullName !== undefined) {
    await db
      .update(students)
      .set({
        fullName: draft.fullName || null,
        birthDate: draft.birthDateBr
          ? brDateToIso(draft.birthDateBr)
          : null,
        email: draft.email || null,
        phone: draft.phone || null,
        grade: draft.grade || null,
        school: draft.school || null,
        cpf: draft.cpf || null,
        rg: draft.rg || null,
        address: draft.address || null,
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
    await db
      .delete(enrollmentCourses)
      .where(eq(enrollmentCourses.enrollmentId, enrollment.id));
    if (draft.courses.length) {
      await db.insert(enrollmentCourses).values(
        draft.courses.map((c) => ({
          enrollmentId: enrollment.id,
          subject: c.subject,
          classCode: c.classCode,
        }))
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
      draftData: JSON.stringify(draft),
      lastActivityAt: new Date(),
    })
    .where(eq(enrollments.id, enrollment.id))
    .returning();

  return updated;
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

  const draft: EnrollmentDraft = enrollment.draftData
    ? (JSON.parse(enrollment.draftData) as EnrollmentDraft)
    : {};

  if (!draft.fullName || !draft.birthDateBr || !draft.email || !draft.phone) {
    throw new Error("DADOS_INCOMPLETOS");
  }
  if (!draft.courses?.length || !draft.modality || !draft.plan || !draft.paymentMethod) {
    throw new Error("DADOS_INCOMPLETOS");
  }
  if (!draft.courseInfoAck || !draft.noticePayment || !draft.noticeAbsence || !draft.noticeModality) {
    throw new Error("AVISOS_PENDENTES");
  }
  if (
    opts.confirmEmail.trim().toLowerCase() !== draft.email.trim().toLowerCase() ||
    opts.confirmPhone.replace(/\D/g, "") !== draft.phone.replace(/\D/g, "")
  ) {
    throw new Error("CONFIRMACAO_INVALIDA");
  }

  const age = calcAge(brDateToIso(draft.birthDateBr)!);
  if (age !== null && age < 18) {
    const fatherOk = draft.fatherName?.trim() && draft.fatherPhone;
    const motherOk = draft.motherName?.trim() && draft.motherPhone;
    if (!fatherOk && !motherOk) throw new Error("RESPONSAVEIS_PENDENTES");
  }

  const subjects = draft.courses.map((c) => c.subject as Subject);
  const pricing = calculatePricing({
    modality: draft.modality as Modality,
    plan: draft.plan as Plan,
    paymentMethod: draft.paymentMethod as PaymentMethod,
    subjects,
  });

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
      lgpdConsent: true,
    })
    .where(eq(students.id, enrollment.studentId!));

  const [updated] = await db
    .update(enrollments)
    .set({
      status: "concluida",
      currentStep: 10,
      modality: draft.modality,
      plan: draft.plan,
      paymentMethod: draft.paymentMethod,
      autoRenew: draft.autoRenew ?? false,
      monthlyValue: String(pricing.monthlyValue),
      planTotal: String(pricing.planTotal),
      enrollmentFee: String(pricing.enrollmentFee),
      declarationName: opts.declarationName,
      declarationIp: opts.ip,
      declarationAt: new Date(),
      completedAt: new Date(),
      lastActivityAt: new Date(),
      draftData: JSON.stringify(draft),
    })
    .where(eq(enrollments.id, enrollment.id))
    .returning();

  const coursesText = draft.courses
    .map((c) => {
      const info = getClassByCode(c.classCode);
      const label = SUBJECT_LABELS[c.subject];
      return `${label} — Turma ${c.classCode}${info ? ` · ${info.day} das ${info.schedule}` : ""}`;
    })
    .join("; ");

  const html = confirmationEmailHtml({
    studentName: draft.fullName,
    age,
    coursesText,
    modality: MODALITY_LABELS[draft.modality as Modality],
    plan: PLAN_LABELS[draft.plan as Plan],
    planDetail: pricing.calculationLabel,
    paymentMethod: PAYMENT_LABELS[draft.paymentMethod as PaymentMethod],
    enrollmentFee: pricing.enrollmentFee,
    autoRenew: draft.autoRenew ?? false,
  });

  const subject = `✅ Matrícula confirmada — ${draft.fullName} | ${COMPANY.name}`;
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
    whatsapp: {
      fullName: draft.fullName,
      phone: draft.phone,
      courses: draft.courses,
      modality: draft.modality as Modality,
      plan: draft.plan as Plan,
      planTotal: pricing.planTotal,
    },
  };
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
