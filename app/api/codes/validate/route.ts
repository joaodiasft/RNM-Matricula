import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { referrals, scholarshipCodes } from "@/lib/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Valida um código no campo único do formulário.
 * Ordem: bolsa (secreta) → indicação. Ambos são uso único.
 */
export async function GET(req: Request) {
  // Limita enumeração por força bruta de códigos de bolsa/indicação.
  const ip = clientIp(req);
  if (!rateLimit(`code-validate:${ip}`, 30, 60_000).ok) {
    return NextResponse.json(
      { valid: false, error: "Muitas tentativas. Aguarde um minuto." },
      { status: 429 }
    );
  }

  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json(
      { valid: false, error: "Informe o código" },
      { status: 400 }
    );
  }

  const db = getDb();

  const [bolsa] = await db
    .select()
    .from(scholarshipCodes)
    .where(eq(scholarshipCodes.code, code))
    .limit(1);

  if (bolsa) {
    if (bolsa.usedAt) {
      return NextResponse.json(
        { valid: false, type: "scholarship", error: "Este código já foi utilizado" },
        { status: 409 }
      );
    }
    return NextResponse.json({
      valid: true,
      type: "scholarship",
      code: bolsa.code,
    });
  }

  const [ref] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.code, code))
    .limit(1);

  if (ref) {
    if (ref.referredEnrollmentId) {
      return NextResponse.json(
        { valid: false, type: "referral", error: "Este código já foi utilizado" },
        { status: 409 }
      );
    }
    return NextResponse.json({
      valid: true,
      type: "referral",
      code: ref.code,
    });
  }

  // Código desconhecido: aceita como indicação digitada (ainda não cadastrada
  // no banco — a secretaria / fluxo de indicação trata depois). Não revela bolsa.
  return NextResponse.json({
    valid: true,
    type: "referral",
    code,
    pending: true,
  });
}
