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

  try {
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      code?: string;
    } | null;

    if (body?.action === "verify") {
      // Trava dupla: por IP e por sessão (token). Com OTP de 6 dígitos (1e6
      // combinações) e no máx. ~6 tentativas/min por sessão, adivinhar é inviável.
      const rlIp = rateLimit(`otp-verify-ip:${ip}`, 10, 60_000);
      const rlToken = rateLimit(`otp-verify-token:${token}`, 6, 60_000);
      if (!rlIp.ok || !rlToken.ok) {
        return NextResponse.json(
          { error: "Muitas tentativas. Aguarde um minuto e reenvie o código." },
          { status: 429 }
        );
      }
      const code = typeof body.code === "string" ? body.code : "";
      await verifyEnrollmentOtp(token, code);
      return NextResponse.json({ ok: true, verified: true });
    }

    // Envio de código: mais restrito para evitar flood de e-mails.
    const rlSend = rateLimit(`otp-send:${ip}`, 5, 5 * 60_000);
    const rlSendToken = rateLimit(`otp-send-token:${token}`, 5, 10 * 60_000);
    if (!rlSend.ok || !rlSendToken.ok) {
      return NextResponse.json(
        { error: "Muitos códigos enviados. Aguarde alguns minutos." },
        { status: 429 }
      );
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
