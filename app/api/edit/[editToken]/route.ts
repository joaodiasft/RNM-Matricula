import { NextResponse } from "next/server";
import {
  getEnrollmentByEditToken,
  updateContactByEditToken,
} from "@/lib/enrollment-service";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ editToken: string }> };

function validToken(t: string): boolean {
  return typeof t === "string" && t.length >= 16 && t.length <= 64;
}

export async function GET(req: Request, { params }: Params) {
  const { editToken } = await params;
  if (!validToken(editToken)) {
    return NextResponse.json({ error: "Link inválido" }, { status: 400 });
  }
  if (!rateLimit(`edit-get:${clientIp(req)}`, 30, 60_000).ok) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }
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
  if (!validToken(editToken)) {
    return NextResponse.json({ error: "Link inválido" }, { status: 400 });
  }
  if (!rateLimit(`edit-patch:${clientIp(req)}`, 15, 60_000).ok) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }
  try {
    const raw = (await req.json().catch(() => null)) as {
      email?: unknown;
      phone?: unknown;
    } | null;
    const email =
      typeof raw?.email === "string" ? raw.email.trim().slice(0, 254) : undefined;
    const phone =
      typeof raw?.phone === "string" ? raw.phone.trim().slice(0, 20) : undefined;
    if (email !== undefined && email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }
    await updateContactByEditToken(editToken, { email, phone });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ERRO";
    return NextResponse.json(
      { error: message === "NOT_FOUND" ? "Link inválido" : "Erro ao salvar" },
      { status: 400 }
    );
  }
}
