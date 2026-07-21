import { NextResponse } from "next/server";
import { and, eq, lt, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { enrollments } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send";
import { COMPANY } from "@/lib/company";

function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Marca obrigações vencidas como nao_cumprida e avisa a secretaria */
export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    const overdue = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.status, "concluida"),
          eq(enrollments.obligationStatus, "pendente"),
          inArray(enrollments.modality, ["desconto", "desconto_parcial"]),
          lt(enrollments.obligationDeadline, today)
        )
      );

    for (const e of overdue) {
      await db
        .update(enrollments)
        .set({
          obligationStatus: "nao_cumprida",
          // volta ao valor normal (modalidade 3) — marca na modalidade efetiva
          modality: "normal",
        })
        .where(eq(enrollments.id, e.id));
    }

    if (overdue.length > 0) {
      const companyEmail = process.env.COMPANY_EMAIL || COMPANY.email;
      await sendEmail({
        to: companyEmail,
        subject: `⚠️ ${overdue.length} obrigação(ões) vencida(s) — valor normalizado`,
        html: `<p>${overdue.length} matrícula(s) tiveram a obrigação não cumprida no prazo e voltaram para a modalidade normal. Revise no painel.</p>`,
      });
    }

    return NextResponse.json({ ok: true, updated: overdue.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Cron falhou" }, { status: 500 });
  }
}
