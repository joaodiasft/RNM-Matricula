import { NextResponse } from "next/server";
import { getClassesAvailability } from "@/lib/enrollment-service";

export async function GET() {
  try {
    const rows = await getClassesAvailability();
    return NextResponse.json({
      classes: rows.map((c) => ({
        code: c.code,
        subject: c.subject,
        weekday: c.weekday,
        schedule: c.schedule,
        maxSeats: c.maxSeats,
        seatsTaken: c.seatsTaken,
        seatsLeft: Math.max(0, c.maxSeats - c.seatsTaken),
        full: c.seatsTaken >= c.maxSeats,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao carregar turmas" }, { status: 500 });
  }
}
