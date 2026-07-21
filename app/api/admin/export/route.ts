import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { buildEnrollmentsWorkbook } from "@/lib/excel";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const today = url.searchParams.get("today") === "1";

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (today) {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateStr = fmt.format(new Date());
    fromDate = new Date(`${dateStr}T00:00:00-03:00`);
    toDate = new Date(`${dateStr}T23:59:59.999-03:00`);
  } else {
    if (from) fromDate = new Date(`${from}T00:00:00-03:00`);
    if (to) toDate = new Date(`${to}T23:59:59.999-03:00`);
  }

  const { buffer, rowCount, contentType, extension } =
    await buildEnrollmentsWorkbook({
      from: fromDate,
      to: toDate,
      onlyCompleted: true,
    });

  const db = getDb();
  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "export_excel",
    entityType: "enrollment",
    meta: JSON.stringify({ from, to, today, rowCount }),
  });

  const fileName = `matriculas-${from || "periodo"}-${to || "agora"}.${extension}`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
