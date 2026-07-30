import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { scholarshipCodes } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth";
import { ensureAccessSchema } from "@/lib/access";
import {
  isScholarshipKind,
  SCHOLARSHIP_KIND_LABELS,
  type ScholarshipKind,
} from "@/lib/scholarship";

function genCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `BOLSA-RNM-${suffix}`;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureAccessSchema();
  const db = getDb();
  const rows = await db
    .select()
    .from(scholarshipCodes)
    .orderBy(desc(scholarshipCodes.createdAt));

  return NextResponse.json({ codes: rows });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    code?: string;
    label?: string;
    count?: number;
    kind?: string;
  };

  const kind: ScholarshipKind = isScholarshipKind(body.kind)
    ? body.kind
    : "full";
  const label =
    body.label?.trim() || SCHOLARSHIP_KIND_LABELS[kind];

  await ensureAccessSchema();
  const db = getDb();
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);
  const created: string[] = [];

  for (let i = 0; i < count; i++) {
    const code =
      i === 0 && body.code?.trim() && count === 1
        ? body.code.trim().toUpperCase()
        : genCode();
    try {
      await db.insert(scholarshipCodes).values({
        code,
        kind,
        label,
        createdByAdminId: session.userId,
      });
      created.push(code);
    } catch {
      const retry = genCode();
      await db.insert(scholarshipCodes).values({
        code: retry,
        kind,
        label,
        createdByAdminId: session.userId,
      });
      created.push(retry);
    }
  }

  return NextResponse.json({ created, kind });
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }
  await ensureAccessSchema();
  const db = getDb();
  const [row] = await db
    .select()
    .from(scholarshipCodes)
    .where(eq(scholarshipCodes.id, id))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (row.usedAt) {
    return NextResponse.json(
      { error: "Não é possível apagar código já usado" },
      { status: 409 }
    );
  }
  await db.delete(scholarshipCodes).where(eq(scholarshipCodes.id, id));
  return NextResponse.json({ ok: true });
}
