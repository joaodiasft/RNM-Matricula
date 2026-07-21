import { NextResponse } from "next/server";
import {
  getEnrollmentByToken,
  patchEnrollment,
} from "@/lib/enrollment-service";
import type { EnrollmentDraft } from "@/lib/validation";
import { patchBodySchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

// Sessão é identificada por token opaco de 32 chars (nanoid). Ainda assim
// limitamos leitura por IP para conter enumeração/varredura de tokens.
export async function GET(req: Request, { params }: Params) {
  const { token } = await params;
  const ip = clientIp(req);
  if (!rateLimit(`enroll-get:${ip}`, 60, 60_000).ok) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }
  if (typeof token !== "string" || token.length < 16 || token.length > 64) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 400 });
  }
  try {
    const enrollment = await getEnrollmentByToken(token);
    if (!enrollment) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    const draft = enrollment.draftData
      ? (JSON.parse(enrollment.draftData) as EnrollmentDraft)
      : {};
    return NextResponse.json(
      {
        token,
        status: enrollment.status,
        currentStep: enrollment.currentStep,
        draft,
        completedAt: enrollment.completedAt,
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err) {
    console.error("[enrollment:get]", err);
    return NextResponse.json({ error: "Erro ao carregar" }, { status: 500 });
  }
}

const MAX_BODY_BYTES = 32 * 1024; // 32 KB — rascunho legítimo é bem menor.

export async function PATCH(req: Request, { params }: Params) {
  const { token } = await params;
  const ip = clientIp(req);
  if (!rateLimit(`enroll-patch:${ip}`, 120, 60_000).ok) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }
  if (typeof token !== "string" || token.length < 16 || token.length > 64) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 400 });
  }
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Dados muito grandes" }, { status: 413 });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    // Nunca confie no cliente: sanitiza tipos, tamanhos, enums e remove
    // qualquer chave desconhecida antes de tocar no banco.
    const parsed = patchBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const updated = await patchEnrollment(token, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      currentStep: updated.currentStep,
      status: updated.status,
    });
  } catch (err) {
    console.error("[enrollment:patch]", err);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
