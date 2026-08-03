import { NextResponse } from "next/server";
import { getEnv } from "@/lib/db";
import { getChargesForEnrollmentLookup } from "@/lib/finance";

function authorized(req: Request): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const secrets = [
    getEnv("INTERNAL_API_SECRET"),
    getEnv("CRON_SECRET"),
    getEnv("MATRICULA_API_SECRET"),
  ].filter(Boolean);
  return secrets.some((s) => s === token);
}

/**
 * Endpoint interno para o Portal do Aluno ler cobranças na Matrícula.
 * Auth: Authorization: Bearer <INTERNAL_API_SECRET|CRON_SECRET>
 * Query: enrollment=R0001 e/ou email=aluno@...
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const enrollment = url.searchParams.get("enrollment");
  const email = url.searchParams.get("email");
  if (!enrollment && !email) {
    return NextResponse.json(
      { error: "Informe enrollment ou email" },
      { status: 400 }
    );
  }

  const charges = await getChargesForEnrollmentLookup({
    enrollmentNumber: enrollment,
    email,
  });

  const open = charges.filter(
    (c) => c.status === "PENDENTE" || c.status === "ATRASADO"
  );
  const openTotal = open.reduce((s, c) => s + Number(c.amount), 0);
  const paidTotal = charges
    .filter((c) => c.status === "PAGO")
    .reduce((s, c) => s + Number(c.amount), 0);

  return NextResponse.json({
    account: {
      status: open.length ? (open.some((c) => c.status === "ATRASADO") ? "ATRASADO" : "EM_ABERTO") : "EM_DIA",
      balance: openTotal.toFixed(2),
    },
    summary: { openTotal, paidTotal, openCount: open.length },
    charges: charges.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      description: c.description,
      amount: c.amount,
      due_date: c.dueDate,
      paid_at: c.paidAt,
      payments: c.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        paid_at: p.paidAt,
        reference: p.reference,
      })),
    })),
  });
}
