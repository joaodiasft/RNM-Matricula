import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  enrollmentCourses,
  enrollments,
  guardians,
  referrals,
  students,
} from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth";
import {
  buildAccessSet,
  ensureAccessSchema,
  getEnrollmentAccesses,
  nextEnrollmentNumber,
  saveEnrollmentAccesses,
  type AccessSet,
} from "@/lib/access";
import { accessEmailHtml } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { COMPANY } from "@/lib/company";

const ACCESS_FIELDS = [
  "sistemaLogin",
  "sistemaPassword",
  "responsavelLogin",
  "responsavelPassword",
  "sofiaLogin",
  "sofiaPassword",
  "correcaoLogin",
  "correcaoPassword",
] as const;

function sanitizeAccessInput(input: unknown): AccessSet | null {
  if (!input || typeof input !== "object") return null;
  const rec = input as Record<string, unknown>;
  const out = {} as AccessSet;
  for (const key of ACCESS_FIELDS) {
    const v = rec[key];
    out[key] = typeof v === "string" ? v.trim().slice(0, 160) : "";
  }
  return out;
}

type Params = { params: Promise<{ id: string }> };

const ALLOWED_STATUS = new Set([
  "em_andamento",
  "concluida",
  "abandonada",
  "alerta_duplicidade",
]);

const ALLOWED_OBLIGATION = new Set([
  "pendente",
  "cumprida",
  "nao_cumprida",
  "parcial",
]);

export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  await ensureAccessSchema();

  const [row] = await db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const accesses = await getEnrollmentAccesses(id);

  const [guardian] = row.student
    ? await db
        .select()
        .from(guardians)
        .where(eq(guardians.studentId, row.student.id))
        .limit(1)
    : [null];

  const courses = await db
    .select()
    .from(enrollmentCourses)
    .where(eq(enrollmentCourses.enrollmentId, id));

  const referralRows = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerEnrollmentId, id));

  let draft: Record<string, unknown> | null = null;
  if (row.enrollment.draftData) {
    try {
      draft = JSON.parse(row.enrollment.draftData) as Record<string, unknown>;
    } catch {
      draft = null;
    }
  }

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "view_enrollment",
    entityType: "enrollment",
    entityId: id,
  });

  return NextResponse.json({
    ...row,
    guardian: guardian ?? null,
    courses,
    referrals: referralRows,
    draft,
    accesses,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    status?: string;
    modality?: string | null;
    plan?: string | null;
    paymentMethod?: string | null;
    autoRenew?: boolean;
    obligationStatus?: string | null;
    obligationDeadline?: string | null;
    obligationDivulged?: boolean | null;
    obligationBroughtStudent?: boolean | null;
    accesses?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const db = getDb();
  await ensureAccessSchema();
  const [existing] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  // Salva acessos editados pela secretaria, se enviados.
  if (body.accesses !== undefined) {
    const set = sanitizeAccessInput(body.accesses);
    if (set) await saveEnrollmentAccesses(id, set);
  }

  if (body.status && !ALLOWED_STATUS.has(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  if (
    body.obligationStatus &&
    !ALLOWED_OBLIGATION.has(body.obligationStatus)
  ) {
    return NextResponse.json(
      { error: "Status de obrigação inválido" },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {
    lastActivityAt: new Date(),
  };

  if (body.status !== undefined) {
    patch.status = body.status;
    if (body.status === "concluida" && !existing.completedAt) {
      patch.completedAt = new Date();
    }
  }
  if (body.modality !== undefined) patch.modality = body.modality;
  if (body.plan !== undefined) patch.plan = body.plan;
  if (body.paymentMethod !== undefined) patch.paymentMethod = body.paymentMethod;
  if (body.autoRenew !== undefined) patch.autoRenew = body.autoRenew;
  if (body.obligationStatus !== undefined) {
    patch.obligationStatus = body.obligationStatus;
  }
  if (body.obligationDeadline !== undefined) {
    patch.obligationDeadline = body.obligationDeadline || null;
  }
  if (body.obligationDivulged !== undefined) {
    patch.obligationDivulged = body.obligationDivulged;
  }
  if (body.obligationBroughtStudent !== undefined) {
    patch.obligationBroughtStudent = body.obligationBroughtStudent;
  }

  const [updated] = await db
    .update(enrollments)
    .set(patch)
    .where(eq(enrollments.id, id))
    .returning();

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "update_enrollment",
    entityType: "enrollment",
    entityId: id,
    // Não registra as senhas no log — apenas se os acessos foram alterados.
    meta: JSON.stringify({ ...body, accesses: body.accesses ? "updated" : undefined }),
  });

  return NextResponse.json({ ok: true, enrollment: updated });
}

/** Ações de acesso: enviar por e-mail e regenerar credenciais padrão. */
export async function POST(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    action?: string;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "Ação ausente" }, { status: 400 });
  }

  const db = getDb();
  await ensureAccessSchema();

  const [row] = await db
    .select({ enrollment: enrollments, student: students })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.id, id))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const studentName = row.student?.fullName || "Aluno";

  if (body.action === "regenerate") {
    const [guardian] = row.student
      ? await db
          .select()
          .from(guardians)
          .where(eq(guardians.studentId, row.student.id))
          .limit(1)
      : [null];
    let draft: Record<string, unknown> | null = null;
    try {
      draft = row.enrollment.draftData
        ? (JSON.parse(row.enrollment.draftData) as Record<string, unknown>)
        : null;
    } catch {
      draft = null;
    }
    const principalIsMother = draft?.principalGuardian === "mae";
    const principalName =
      (principalIsMother
        ? guardian?.motherName || guardian?.fatherName
        : guardian?.fatherName || guardian?.motherName) || studentName;

    const enrollmentNumber =
      row.enrollment.enrollmentNumber || (await nextEnrollmentNumber());
    if (!row.enrollment.enrollmentNumber) {
      await db
        .update(enrollments)
        .set({ enrollmentNumber })
        .where(eq(enrollments.id, id));
    }
    const set = buildAccessSet({ enrollmentNumber, studentName, principalName });
    await saveEnrollmentAccesses(id, set);
    await db.insert(auditLogs).values({
      adminUserId: session.userId,
      action: "regenerate_accesses",
      entityType: "enrollment",
      entityId: id,
    });
    return NextResponse.json({ ok: true, accesses: set, enrollmentNumber });
  }

  if (body.action === "send_email") {
    const accesses = await getEnrollmentAccesses(id);
    if (!accesses) {
      return NextResponse.json(
        { error: "Gere os acessos antes de enviar." },
        { status: 400 }
      );
    }
    const to = row.student?.email;
    if (!to) {
      return NextResponse.json(
        { error: "Aluno sem e-mail cadastrado." },
        { status: 400 }
      );
    }
    const html = accessEmailHtml({
      studentName,
      enrollmentNumber: row.enrollment.enrollmentNumber,
      accesses,
    });
    const sent = await sendEmail({
      to,
      subject: `🔐 Seus acessos — ${COMPANY.name}`,
      html,
    });
    await db.insert(auditLogs).values({
      adminUserId: session.userId,
      action: "send_access_email",
      entityType: "enrollment",
      entityId: id,
    });
    if (sent.skipped) {
      return NextResponse.json(
        { error: "Envio de e-mail não configurado." },
        { status: 502 }
      );
    }
    if ("error" in sent && sent.error) {
      return NextResponse.json({ error: "Falha ao enviar e-mail." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sentTo: to });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (row.studentId) {
    await db.delete(students).where(eq(students.id, row.studentId));
  } else {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "lgpd_delete",
    entityType: "enrollment",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
