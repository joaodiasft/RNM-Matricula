import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { enrollments } from "@/lib/db/schema";
import { abandonmentEmailHtml } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { COMPANY } from "@/lib/company";
import { calcAge } from "@/lib/validation";
import { getClassByCode, SUBJECT_LABELS } from "@/lib/courses";
import type { EnrollmentDraft } from "@/lib/validation";
import { enrollmentCourses } from "@/lib/db/schema";
import {
  listLateStaleEnrollments,
  purgeEarlyIncompleteEnrollments,
} from "@/lib/enrollment-cleanup";

function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail-closed em produção: sem secret configurado, nega. Em dev, libera.
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Cron de limpeza / abandono:
 * 1) Apaga rascunhos parados ANTES do passo 6 há +24h (última atividade).
 * 2) Marca como abandonada (+ e-mail) quem já passou do passo 6 e parou +1h.
 */
export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const purged = await purgeEarlyIncompleteEnrollments(
      24 * 60 * 60 * 1000
    );

    const stale = await listLateStaleEnrollments(60 * 60 * 1000);
    const db = getDb();
    let notified = 0;
    const companyEmail = process.env.COMPANY_EMAIL || COMPANY.email;

    for (const row of stale) {
      const e = row.enrollment;
      const s = row.student;
      const draft: EnrollmentDraft = e.draftData
        ? (JSON.parse(e.draftData) as EnrollmentDraft)
        : {};

      const courses = await db
        .select()
        .from(enrollmentCourses)
        .where(eq(enrollmentCourses.enrollmentId, e.id));

      const coursesText =
        courses
          .map((c) => {
            const info = getClassByCode(c.classCode);
            const label =
              SUBJECT_LABELS[c.subject as keyof typeof SUBJECT_LABELS] ??
              c.subject;
            return `${label} ${c.classCode}${info ? ` (${info.day})` : ""}`;
          })
          .join(", ") ||
        draft.courses
          ?.map((c) => `${c.subject} ${c.classCode}`)
          .join(", ") ||
        undefined;

      const age = s?.birthDate ? calcAge(s.birthDate) : null;
      const name = s?.fullName || draft.fullName;

      const html = abandonmentEmailHtml({
        fullName: name,
        age,
        email: s?.email || draft.email,
        phone: s?.phone || draft.phone,
        grade: s?.grade || draft.grade,
        school: s?.school || draft.school,
        referralSource: s?.referralSource || draft.referralSource,
        coursesText,
        currentStep: e.currentStep,
        lastActivityAt: e.lastActivityAt
          ? new Date(e.lastActivityAt).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })
          : "—",
      });

      const sent = await sendEmail({
        to: companyEmail,
        subject: `⚠️ Matrícula não finalizada — ${name || "sem nome"}`,
        html,
      });

      // Só marca abandono se o aviso saiu (ou e-mail desligado em dev).
      if (sent && "error" in sent && sent.error) {
        continue;
      }

      await db
        .update(enrollments)
        .set({
          abandonedNotified: true,
          status: "abandonada",
        })
        .where(eq(enrollments.id, e.id));

      notified++;
    }

    return NextResponse.json({
      ok: true,
      purged: purged.deleted,
      purgedIds: purged.ids,
      notified,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Cron falhou" }, { status: 500 });
  }
}
