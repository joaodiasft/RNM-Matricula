import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getChamadaDb, hasChamadaDb } from "@/lib/chamada/db";
import {
  chamadaAulas,
  chamadaModulos,
  chamadaPresencas,
  type StatusPresenca,
} from "@/lib/chamada/schema";

const VALID: StatusPresenca[] = ["PRESENTE", "FALTA", "JUSTIFICADA"];

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!hasChamadaDb()) {
    return NextResponse.json(
      { error: "CHAMADA_DATABASE_URL não configurada" },
      { status: 503 }
    );
  }

  try {
    const db = getChamadaDb();
    const url = new URL(req.url);
    const aulaId = url.searchParams.get("aulaId");
    const mesId = url.searchParams.get("mesId");

    if (aulaId) {
      const rows = await db
        .select()
        .from(chamadaPresencas)
        .where(eq(chamadaPresencas.aulaId, aulaId));
      return NextResponse.json(rows);
    }

    if (mesId) {
      const mods = await db
        .select({ id: chamadaModulos.id })
        .from(chamadaModulos)
        .where(eq(chamadaModulos.mesId, mesId));
      const modIds = mods.map((m) => m.id);
      if (!modIds.length) return NextResponse.json([]);

      const aulas = await db
        .select({ id: chamadaAulas.id })
        .from(chamadaAulas)
        .where(inArray(chamadaAulas.moduloId, modIds));
      const aulaIds = aulas.map((a) => a.id);
      if (!aulaIds.length) return NextResponse.json([]);

      const rows = await db
        .select()
        .from(chamadaPresencas)
        .where(inArray(chamadaPresencas.aulaId, aulaIds));
      return NextResponse.json(rows);
    }

    return NextResponse.json(
      { error: "aulaId ou mesId obrigatório" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[chamada/presencas GET]", err);
    return NextResponse.json({ error: "Erro ao listar presenças" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!hasChamadaDb()) {
    return NextResponse.json(
      { error: "CHAMADA_DATABASE_URL não configurada" },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      aulaId?: string;
      registros?: {
        alunoId: string;
        status: StatusPresenca;
        redacaoEntregue?: boolean;
      }[];
    } | null;

    if (!body?.aulaId || !Array.isArray(body.registros)) {
      return NextResponse.json(
        { error: "aulaId e registros são obrigatórios" },
        { status: 400 }
      );
    }

    const db = getChamadaDb();
    const aulaId = body.aulaId;
    let count = 0;

    for (const r of body.registros) {
      if (!r.alunoId || !VALID.includes(r.status)) continue;
      const now = new Date();
      await db
        .insert(chamadaPresencas)
        .values({
          id: nanoid(),
          alunoId: r.alunoId,
          aulaId,
          status: r.status,
          redacaoEntregue: Boolean(r.redacaoEntregue),
          atualizadoEm: now,
        })
        .onConflictDoUpdate({
          target: [chamadaPresencas.alunoId, chamadaPresencas.aulaId],
          set: {
            status: r.status,
            redacaoEntregue: Boolean(r.redacaoEntregue),
            atualizadoEm: now,
          },
        });
      count++;
    }

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error("[chamada/presencas POST]", err);
    return NextResponse.json({ error: "Erro ao salvar chamada" }, { status: 500 });
  }
}
