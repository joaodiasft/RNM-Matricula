import { NextResponse } from "next/server";
import {
  sendEnrollmentOtp,
  verifyEnrollmentOtp,
} from "@/lib/enrollment-service";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const ip = clientIp(req);
  const rl = rateLimit(`otp:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { action?: string; code?: string };
    if (body.action === "verify") {
      await verifyEnrollmentOtp(token, body.code || "");
      return NextResponse.json({ ok: true, verified: true });
    }
    const result = await sendEnrollmentOtp(token);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "ERRO";
    const map: Record<string, string> = {
      NOT_FOUND: "Sessão não encontrada",
      EMAIL_AUSENTE: "Informe o e-mail antes",
      OTP_NAO_ENVIADO: "Peça um código primeiro",
      OTP_EXPIRADO: "Código expirado — reenvie",
      OTP_INVALIDO: "Código inválido",
    };
    return NextResponse.json(
      { error: map[message] || "Falha no OTP" },
      { status: 400 }
    );
  }
}
