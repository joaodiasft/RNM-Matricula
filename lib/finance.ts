import { desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  enrollmentCourses,
  enrollments,
  financialCharges,
  financialPayments,
  students,
} from "./db/schema";
import { SUBJECT_LABELS, type Subject } from "./courses";

export const CHARGE_TYPES = [
  { value: "MENSALIDADE", label: "Mensalidade" },
  { value: "MATRICULA", label: "Matrícula" },
  { value: "MODULO", label: "Módulo" },
  { value: "MATERIAL", label: "Material" },
  { value: "TAXA_EXTRA", label: "Taxa extra" },
  { value: "REMATRICULA", label: "Rematrícula" },
] as const;

export const PAYMENT_METHODS = [
  { value: "PIX", label: "Pix" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO", label: "Cartão" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferência" },
] as const;

export const CHARGE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  CHARGE_TYPES.map((t) => [t.value, t.label])
);
export const PAYMENT_METHOD_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label])
);

export const CHARGE_STATUS_LABELS: Record<
  string,
  { text: string; tone: "default" | "brand" | "success" | "warning" | "danger" }
> = {
  PENDENTE: { text: "Pendente", tone: "warning" },
  ATRASADO: { text: "Atrasado", tone: "danger" },
  PAGO: { text: "Pago", tone: "success" },
  CANCELADO: { text: "Cancelado", tone: "default" },
};

let financeSchemaReady = false;

export async function ensureFinanceSchema() {
  if (financeSchemaReady) return;
  const db = getDb();
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS financial_charges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      type text NOT NULL DEFAULT 'MENSALIDADE',
      status text NOT NULL DEFAULT 'PENDENTE',
      description text,
      amount numeric(10,2) NOT NULL,
      due_date date NOT NULL,
      paid_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS financial_payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      charge_id uuid NOT NULL REFERENCES financial_charges(id) ON DELETE CASCADE,
      amount numeric(10,2) NOT NULL,
      method text NOT NULL DEFAULT 'PIX',
      paid_at timestamptz DEFAULT now(),
      reference text,
      created_at timestamptz DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS financial_charges_enrollment_idx ON financial_charges (enrollment_id)`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS financial_charges_due_idx ON financial_charges (due_date)`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS financial_payments_charge_idx ON financial_payments (charge_id)`
    );
    financeSchemaReady = true;
  } catch (err) {
    console.error("[finance] ensureFinanceSchema:", err);
  }
}

function todayIsoSP(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

export function resolveChargeStatus(
  status: string,
  dueDate: string | null
): string {
  if (status === "PAGO" || status === "CANCELADO") return status;
  if (dueDate && dueDate < todayIsoSP()) return "ATRASADO";
  return status === "ATRASADO" ? "ATRASADO" : "PENDENTE";
}

export type FinanceStudentOption = {
  enrollmentId: string;
  fullName: string;
  enrollmentNumber: string | null;
  email: string | null;
  monthlyValue: string | null;
};

export type FinanceChargeRow = {
  id: string;
  enrollmentId: string;
  type: string;
  status: string;
  description: string | null;
  amount: string;
  dueDate: string | null;
  paidAt: string | null;
  studentName: string;
  enrollmentNumber: string | null;
  payments: {
    id: string;
    amount: string;
    method: string;
    paidAt: string | null;
    reference: string | null;
  }[];
};

export type ClassFinanceSummary = {
  classCode: string;
  classLabel: string;
  subject: string;
  studentCount: number;
  openTotal: number;
  paidTotal: number;
  overdueCount: number;
  openCount: number;
};

export async function listStudentsForFinance(): Promise<FinanceStudentOption[]> {
  await ensureFinanceSchema();
  const db = getDb();
  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      fullName: students.fullName,
      enrollmentNumber: enrollments.enrollmentNumber,
      email: students.email,
      monthlyValue: enrollments.monthlyValue,
      status: enrollments.status,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.status, "concluida"))
    .orderBy(desc(enrollments.completedAt))
    .limit(500);

  return rows
    .map((r) => ({
      enrollmentId: r.enrollmentId,
      fullName: r.fullName || "Sem nome",
      enrollmentNumber: r.enrollmentNumber,
      email: r.email,
      monthlyValue: r.monthlyValue,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));
}

export async function listAllCharges(): Promise<FinanceChargeRow[]> {
  await ensureFinanceSchema();
  const db = getDb();
  const rows = await db
    .select({
      charge: financialCharges,
      enrollmentNumber: enrollments.enrollmentNumber,
      studentName: students.fullName,
    })
    .from(financialCharges)
    .innerJoin(enrollments, eq(financialCharges.enrollmentId, enrollments.id))
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .orderBy(desc(financialCharges.dueDate))
    .limit(500);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.charge.id);
  const pays = await db
    .select()
    .from(financialPayments)
    .where(inArray(financialPayments.chargeId, ids))
    .orderBy(desc(financialPayments.paidAt));

  const byCharge = new Map<string, typeof pays>();
  for (const p of pays) {
    const arr = byCharge.get(p.chargeId) ?? [];
    arr.push(p);
    byCharge.set(p.chargeId, arr);
  }

  return rows.map((r) => {
    const status = resolveChargeStatus(
      r.charge.status,
      r.charge.dueDate ? String(r.charge.dueDate) : null
    );
    return {
      id: r.charge.id,
      enrollmentId: r.charge.enrollmentId,
      type: r.charge.type,
      status,
      description: r.charge.description,
      amount: String(r.charge.amount),
      dueDate: r.charge.dueDate ? String(r.charge.dueDate) : null,
      paidAt: r.charge.paidAt ? r.charge.paidAt.toISOString() : null,
      studentName: r.studentName || "Aluno",
      enrollmentNumber: r.enrollmentNumber,
      payments: (byCharge.get(r.charge.id) ?? []).map((p) => ({
        id: p.id,
        amount: String(p.amount),
        method: p.method,
        paidAt: p.paidAt ? p.paidAt.toISOString() : null,
        reference: p.reference,
      })),
    };
  });
}

export async function getFinanceByClass(): Promise<ClassFinanceSummary[]> {
  await ensureFinanceSchema();
  const db = getDb();

  const [courseRows, chargeRows] = await Promise.all([
    db
      .select({
        enrollmentId: enrollmentCourses.enrollmentId,
        classCode: enrollmentCourses.classCode,
        subject: enrollmentCourses.subject,
        status: enrollments.status,
      })
      .from(enrollmentCourses)
      .innerJoin(
        enrollments,
        eq(enrollmentCourses.enrollmentId, enrollments.id)
      )
      .where(eq(enrollments.status, "concluida")),
    db.select().from(financialCharges),
  ]);

  const chargesByEnrollment = new Map<string, typeof chargeRows>();
  for (const c of chargeRows) {
    const arr = chargesByEnrollment.get(c.enrollmentId) ?? [];
    arr.push(c);
    chargesByEnrollment.set(c.enrollmentId, arr);
  }

  const byClass = new Map<
    string,
    ClassFinanceSummary & { students: Set<string> }
  >();

  for (const row of courseRows) {
    const key = row.classCode;
    let entry = byClass.get(key);
    if (!entry) {
      const subject = row.subject as Subject;
      entry = {
        classCode: key,
        classLabel: `${SUBJECT_LABELS[subject] ?? row.subject} · ${key}`,
        subject: row.subject,
        studentCount: 0,
        openTotal: 0,
        paidTotal: 0,
        overdueCount: 0,
        openCount: 0,
        students: new Set(),
      };
      byClass.set(key, entry);
    }
    if (entry.students.has(row.enrollmentId)) continue;
    entry.students.add(row.enrollmentId);

    const charges = chargesByEnrollment.get(row.enrollmentId) ?? [];
    for (const c of charges) {
      const status = resolveChargeStatus(
        c.status,
        c.dueDate ? String(c.dueDate) : null
      );
      const amount = Number(c.amount) || 0;
      if (status === "PAGO") entry.paidTotal += amount;
      if (status === "PENDENTE" || status === "ATRASADO") {
        entry.openTotal += amount;
        entry.openCount += 1;
      }
      if (status === "ATRASADO") entry.overdueCount += 1;
    }
  }

  return [...byClass.values()]
    .map(({ students: set, ...rest }) => ({
      ...rest,
      studentCount: set.size,
    }))
    .sort((a, b) => a.classCode.localeCompare(b.classCode, "pt-BR"));
}

export async function createCharge(input: {
  enrollmentId: string;
  type: string;
  amount: number;
  dueDate: string;
  description?: string | null;
}): Promise<{ id: string } | { error: string }> {
  await ensureFinanceSchema();
  if (!input.enrollmentId) return { error: "Selecione o aluno." };
  if (!input.dueDate) return { error: "Informe o vencimento." };
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "Valor inválido." };
  }

  const db = getDb();
  const [enr] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(eq(enrollments.id, input.enrollmentId))
    .limit(1);
  if (!enr) return { error: "Matrícula não encontrada." };

  const [row] = await db
    .insert(financialCharges)
    .values({
      enrollmentId: input.enrollmentId,
      type: input.type || "MENSALIDADE",
      status: "PENDENTE",
      description: input.description?.trim() || null,
      amount: input.amount.toFixed(2),
      dueDate: input.dueDate,
    })
    .returning({ id: financialCharges.id });

  return { id: row.id };
}

export async function registerPayment(input: {
  chargeId: string;
  method: string;
  amount?: number | null;
  paidAt?: string | null;
  reference?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  await ensureFinanceSchema();
  if (!input.chargeId) return { error: "Selecione a cobrança." };
  if (!input.method) return { error: "Informe a forma de pagamento." };

  const db = getDb();
  const [charge] = await db
    .select()
    .from(financialCharges)
    .where(eq(financialCharges.id, input.chargeId))
    .limit(1);
  if (!charge) return { error: "Cobrança não encontrada." };
  if (charge.status === "PAGO") return { error: "Cobrança já está paga." };

  const amount =
    input.amount != null && Number.isFinite(input.amount) && input.amount > 0
      ? input.amount
      : Number(charge.amount);

  const paidAt = input.paidAt
    ? new Date(`${input.paidAt}T12:00:00-03:00`)
    : new Date();

  await db.insert(financialPayments).values({
    chargeId: charge.id,
    amount: amount.toFixed(2),
    method: input.method,
    paidAt,
    reference: input.reference?.trim() || null,
  });

  await db
    .update(financialCharges)
    .set({
      status: "PAGO",
      paidAt,
      updatedAt: new Date(),
    })
    .where(eq(financialCharges.id, charge.id));

  const month = paidAt.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  await db
    .update(enrollments)
    .set({
      paymentStatus: "pago",
      paymentMonth: month,
      paymentForm: input.method.toLowerCase(),
      paymentPaidOn: paidAt.toISOString().slice(0, 10),
    })
    .where(eq(enrollments.id, charge.enrollmentId));

  return { ok: true };
}

export async function getChargesForEnrollmentLookup(input: {
  enrollmentNumber?: string | null;
  email?: string | null;
}): Promise<FinanceChargeRow[]> {
  await ensureFinanceSchema();
  const number = input.enrollmentNumber?.trim().toUpperCase();
  const email = input.email?.trim().toLowerCase();
  if (!number && !email) return [];

  const db = getDb();
  let enrollmentId: string | undefined;

  if (number) {
    const [byNum] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.enrollmentNumber, number))
      .limit(1);
    enrollmentId = byNum?.id;
  }
  if (!enrollmentId && email) {
    const [byEmail] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .where(sql`lower(${students.email}) = ${email}`)
      .orderBy(desc(enrollments.completedAt))
      .limit(1);
    enrollmentId = byEmail?.id;
  }
  if (!enrollmentId) return [];

  const all = await listAllCharges();
  return all.filter((c) => c.enrollmentId === enrollmentId);
}
