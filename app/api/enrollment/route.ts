import { NextResponse } from "next/server";
import { createEnrollmentSession } from "@/lib/enrollment-service";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`enroll-create:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto." },
      { status: 429 }
    );
  }

  try {
    const session = await createEnrollmentSession();
    return NextResponse.json(session);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Não foi possível iniciar a matrícula" },
      { status: 500 }
    );
  }
}
