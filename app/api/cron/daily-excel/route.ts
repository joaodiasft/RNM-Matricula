import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { dailyExports } from "@/lib/db/schema";
import { buildEnrollmentsWorkbook } from "@/lib/excel";

function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail-closed em produção: sem secret configurado, nega. Em dev, libera.
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function todayInSaoPaulo(): { start: Date; end: Date; dateStr: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = fmt.format(new Date());
  // Interpret midnight SP as UTC bounds approx via offset -03
  const start = new Date(`${dateStr}T00:00:00-03:00`);
  const end = new Date(`${dateStr}T23:59:59.999-03:00`);
  return { start, end, dateStr };
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { start, end, dateStr } = todayInSaoPaulo();
    const { buffer, rowCount } = await buildEnrollmentsWorkbook({
      from: start,
      to: end,
      onlyCompleted: true,
    });

    const fileName = `matriculas-${dateStr}.xlsx`;
    const db = getDb();

    // Persistência local em base64 no registro (R2 opcional via binding)
    const r2Key = `exports/${fileName}`;
    await db.insert(dailyExports).values({
      exportDate: dateStr,
      r2Key,
      fileName,
      rowCount,
    });

    // Em Workers com R2 binding, o worker cron pode fazer upload.
    // Aqui retornamos o arquivo para download imediato / uso do admin.
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Row-Count": String(rowCount),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Cron Excel falhou" }, { status: 500 });
  }
}
