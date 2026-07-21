import { NextResponse } from "next/server";
import {
  sendEnrollmentOtp,
  verifyEnrollmentByPhoneTail,
  verifyEnrollmentOtp,
} from "@/lib/enrollment-service";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { COMPANY } from "@/lib/company";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const ip = clientIp(req);

  try {
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      code?: string;
      phoneTail?: string;
    } | null;

    if (body?.action === "verify") {
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

    if (body?.action === "verify-phone") {
      const rlIp = rateLimit(`otp-phone-ip:${ip}`, 8, 60_000);
      const rlToken = rateLimit(`otp-phone-token:${token}`, 6, 60_000);
      if (!rlIp.ok || !rlToken.ok) {
        return NextResponse.json(
          { error: "Muitas tentativas. Aguarde um minuto." },
          { status: 429 }
        );
      }
      const phoneTail = typeof body.phoneTail === "string" ? body.phoneTail : "";
      await verifyEnrollmentByPhoneTail(token, phoneTail);
      return NextResponse.json({ ok: true, verified: true, method: "phone" });
    }

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
      EMAIL_AUSENTE: "Informe o e-mail nos dados do aluno antes de continuar",
      EMAIL_NAO_CONFIGURADO: `Envio de e-mail não configurado. Fale com a secretaria: ${COMPANY.phone}`,
      EMAIL_DOMINIO: `Não foi possível enviar o código para este e-mail agora. Use a verificação pelo telefone abaixo ou fale no WhatsApp ${COMPANY.phone}.`,
      EMAIL_FALHOU: `Falha ao enviar o código. Tente de novo ou fale no WhatsApp ${COMPANY.phone}.`,
      OTP_NAO_ENVIADO: "Peça um código primeiro",
      OTP_EXPIRADO: "Código expirado — reenvie",
      OTP_INVALIDO: "Código inválido",
      TELEFONE_INVALIDO: "Os dígitos não batem com o WhatsApp cadastrado",
    };
    const status =
      message === "EMAIL_DOMINIO" || message === "EMAIL_FALHOU" ? 502 : 400;
    return NextResponse.json(
      {
        error: map[message] || "Falha no OTP",
        code: message,
        allowPhoneFallback:
          message === "EMAIL_DOMINIO" ||
          message === "EMAIL_FALHOU" ||
          message === "EMAIL_NAO_CONFIGURADO",
      },
      { status }
    );
  }
}
