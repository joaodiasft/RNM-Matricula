import { asc, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getChamadaDb, hasChamadaDb } from "@/lib/chamada/db";
import {
  chamadaAlunoMes,
  chamadaAlunos,
  chamadaAulas,
  chamadaMeses,
  chamadaModulos,
  chamadaPresencas,
} from "@/lib/chamada/schema";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!hasChamadaDb()) {
    return NextResponse.json(
      {
        error:
          "CHAMADA_DATABASE_URL não configurada. Configure o banco do RNM-Chamada.",
      },
      { status: 503 }
    );
  }

  try {
    const db = getChamadaDb();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      const [mes] = await db
        .select()
        .from(chamadaMeses)
        .where(eq(chamadaMeses.id, id))
        .limit(1);
      if (!mes) {
        return NextResponse.json({ error: "Mês não encontrado" }, { status: 404 });
      }

      const modulos = await db
        .select()
        .from(chamadaModulos)
        .where(eq(chamadaModulos.mesId, id))
        .orderBy(asc(chamadaModulos.numero));

      const moduloIds = modulos.map((m) => m.id);
      const aulas =
        moduloIds.length === 0
          ? []
          : await db
              .select()
              .from(chamadaAulas)
              .where(inArray(chamadaAulas.moduloId, moduloIds))
              .orderBy(asc(chamadaAulas.numero));

      const alunoMesRows = await db
        .select({
          id: chamadaAlunoMes.id,
          alunoId: chamadaAlunoMes.alunoId,
          mesId: chamadaAlunoMes.mesId,
          aluno: {
            id: chamadaAlunos.id,
            nome: chamadaAlunos.nome,
            ativo: chamadaAlunos.ativo,
          },
        })
        .from(chamadaAlunoMes)
        .innerJoin(
          chamadaAlunos,
          eq(chamadaAlunoMes.alunoId, chamadaAlunos.id)
        )
        .where(eq(chamadaAlunoMes.mesId, id))
        .orderBy(asc(chamadaAlunos.nome));

      const modulosComAulas = modulos.map((m) => ({
        ...m,
        aulas: aulas
          .filter((a) => a.moduloId === m.id)
          .map((a) => ({
            id: a.id,
            numero: a.numero,
            data: a.data instanceof Date ? a.data.toISOString() : a.data,
          })),
      }));

      return NextResponse.json({
        ...mes,
        modulos: modulosComAulas,
        alunos: alunoMesRows,
      });
    }

    const meses = await db
      .select()
      .from(chamadaMeses)
      .orderBy(desc(chamadaMeses.ano), asc(chamadaMeses.nome));

    return NextResponse.json(meses);
  } catch (err) {
    console.error("[chamada/meses]", err);
    return NextResponse.json(
      { error: "Erro ao consultar meses da chamada" },
      { status: 500 }
    );
  }
}
