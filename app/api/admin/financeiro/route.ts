import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  createCharge,
  getFinanceByClass,
  listAllCharges,
  listStudentsForFinance,
  registerPayment,
} from "@/lib/finance";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [students, charges, byClass] = await Promise.all([
    listStudentsForFinance(),
    listAllCharges(),
    getFinanceByClass(),
  ]);

  return NextResponse.json({ students, charges, byClass });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    action?: string;
    enrollmentId?: string;
    type?: string;
    amount?: number | string;
    dueDate?: string;
    description?: string;
    chargeId?: string;
    method?: string;
    paidAt?: string;
    reference?: string;
  };

  if (body.action === "create_charge") {
    const amount =
      typeof body.amount === "string"
        ? Number(String(body.amount).replace(",", "."))
        : Number(body.amount);
    const result = await createCharge({
      enrollmentId: body.enrollmentId || "",
      type: body.type || "MENSALIDADE",
      amount,
      dueDate: body.dueDate || "",
      description: body.description,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: result.id });
  }

  if (body.action === "register_payment") {
    const amountRaw = body.amount;
    const amount =
      amountRaw === "" || amountRaw == null
        ? null
        : typeof amountRaw === "string"
          ? Number(String(amountRaw).replace(",", "."))
          : Number(amountRaw);
    const result = await registerPayment({
      chargeId: body.chargeId || "",
      method: body.method || "PIX",
      amount,
      paidAt: body.paidAt,
      reference: body.reference,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
