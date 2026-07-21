import { NextResponse } from "next/server";
import {
  getEnrollmentByEditToken,
  updateContactByEditToken,
} from "@/lib/enrollment-service";

type Params = { params: Promise<{ editToken: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { editToken } = await params;
  try {
    const row = await getEnrollmentByEditToken(editToken);
    if (!row || row.enrollment.status !== "concluida") {
      return NextResponse.json({ error: "Link inválido" }, { status: 404 });
    }
    return NextResponse.json({
      fullName: row.student?.fullName,
      email: row.student?.email,
      phone: row.student?.phone,
    });
  } catch {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { editToken } = await params;
  try {
    const body = (await req.json()) as { email?: string; phone?: string };
    await updateContactByEditToken(editToken, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ERRO";
    return NextResponse.json(
      { error: message === "NOT_FOUND" ? "Link inválido" : "Erro ao salvar" },
      { status: 400 }
    );
  }
}
