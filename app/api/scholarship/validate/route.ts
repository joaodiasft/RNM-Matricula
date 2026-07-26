import { eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { scholarshipCodes } from "@/lib/db/schema";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false, error: "Informe o código" }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(scholarshipCodes)
    .where(eq(scholarshipCodes.code, code))
    .limit(1);

  if (!row) {
    return NextResponse.json(
      { valid: false, error: "Código inválido" },
      { status: 404 }
    );
  }
  if (row.usedAt) {
    return NextResponse.json(
      {
        valid: false,
        error: "Este código já foi utilizado",
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ valid: true, code: row.code, label: row.label });
}

/** Lista só disponibilidade pública mínima — não usado; admin tem rota própria */
export async function HEAD() {
  const db = getDb();
  const free = await db
    .select({ code: scholarshipCodes.code })
    .from(scholarshipCodes)
    .where(isNull(scholarshipCodes.usedAt))
    .limit(1);
  return new NextResponse(null, { status: free.length ? 200 : 204 });
}
