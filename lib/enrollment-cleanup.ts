import { and, eq, inArray, lt, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { enrollments, students } from "@/lib/db/schema";

/** Passos a partir do plano de pagamento (já “avançou” no funil). */
export const PLAN_AND_LATER_STEPS = [6, 7, 8, 9, 10] as const;

/** Ainda não chegou no passo 6 (inclui o 11 = compromissos, que vem antes do 6). */
export function isBeforePlanStep(currentStep: number): boolean {
  return !PLAN_AND_LATER_STEPS.includes(
    currentStep as (typeof PLAN_AND_LATER_STEPS)[number]
  );
}

/**
 * Apaga matrículas em andamento que pararam ANTES do passo 6
 * e ficaram sem atividade por `olderThanMs` (padrão: 24h).
 * Concluídas nunca entram aqui.
 */
export async function purgeEarlyIncompleteEnrollments(
  olderThanMs = 24 * 60 * 60 * 1000
): Promise<{ deleted: number; ids: string[] }> {
  const db = getDb();
  const cutoff = new Date(Date.now() - olderThanMs);

  const stale = await db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      currentStep: enrollments.currentStep,
    })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.status, "em_andamento"),
        lt(enrollments.lastActivityAt, cutoff),
        notInArray(enrollments.currentStep, [...PLAN_AND_LATER_STEPS])
      )
    )
    .limit(200);

  const ids: string[] = [];
  for (const row of stale) {
    // Apaga o aluno → cascade limpa matrícula, cursos, waitlist, acessos, etc.
    if (row.studentId) {
      await db.delete(students).where(eq(students.id, row.studentId));
    } else {
      await db.delete(enrollments).where(eq(enrollments.id, row.id));
    }
    ids.push(row.id);
  }

  if (ids.length) {
    // Auditoria leve via SQL raw (sem admin session no cron).
    try {
      await db.execute(
        sql`INSERT INTO audit_logs (action, entity_type, meta)
            VALUES (
              'cron_purge_early_incomplete',
              'enrollment',
              ${JSON.stringify({ count: ids.length, ids, cutoff: cutoff.toISOString() })}
            )`
      );
    } catch {
      /* audit opcional */
    }
  }

  return { deleted: ids.length, ids };
}

/** Matrículas em andamento já no plano+ que estão inativas (para marcar abandonada). */
export async function listLateStaleEnrollments(olderThanMs = 60 * 60 * 1000) {
  const db = getDb();
  const cutoff = new Date(Date.now() - olderThanMs);

  return db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .where(
      and(
        eq(enrollments.status, "em_andamento"),
        eq(enrollments.abandonedNotified, false),
        lt(enrollments.lastActivityAt, cutoff),
        inArray(enrollments.currentStep, [...PLAN_AND_LATER_STEPS])
      )
    );
}
