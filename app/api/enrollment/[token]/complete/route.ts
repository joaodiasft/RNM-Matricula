import { NextResponse } from "next/server";
import { completeEnrollment } from "@/lib/enrollment-service";
import { verifyTurnstile } from "@/lib/turnstile";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const ip = clientIp(req);
  const rl = rateLimit(`enroll-complete:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as {
      declarationName?: string;
      confirmEmail?: string;
      confirmPhone?: string;
      turnstileToken?: string;
    };

    const okTurnstile = await verifyTurnstile(body.turnstileToken);
    if (!okTurnstile) {
      return NextResponse.json(
        { error: "Verificação anti-robô falhou. Tente novamente." },
        { status: 400 }
      );
    }

    if (!body.declarationName?.trim()) {
      return NextResponse.json(
        { error: "Digite seu nome para a declaração digital." },
        { status: 400 }
      );
    }

    const result = await completeEnrollment(token, {
      declarationName: body.declarationName.trim(),
      ip,
      confirmEmail: body.confirmEmail || "",
      confirmPhone: body.confirmPhone || "",
    });

    if (result.alreadyCompleted) {
      return NextResponse.json({ ok: true, alreadyCompleted: true });
    }

    const whatsappUrl = buildWhatsAppUrl(result.whatsapp!);

    return NextResponse.json({
      ok: true,
      alreadyCompleted: false,
      pricing: result.pricing,
      whatsappUrl,
      studentName: result.draft!.fullName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ERRO";
    const map: Record<string, string> = {
      NOT_FOUND: "Sessão não encontrada",
      DADOS_INCOMPLETOS: "Preencha todos os dados obrigatórios",
      AVISOS_PENDENTES: "Aceite todos os avisos antes de concluir",
      CONFIRMACAO_INVALIDA: "Confirme e-mail e telefone corretamente",
      RESPONSAVEIS_PENDENTES: "Preencha pelo menos um responsável",
    };
    console.error(err);
    return NextResponse.json(
      { error: map[message] || "Não foi possível concluir a matrícula" },
      { status: message === "NOT_FOUND" ? 404 : 400 }
    );
  }
}
