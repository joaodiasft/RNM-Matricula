import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import {
  createAdminSession,
  destroyAdminSession,
  verifyPassword,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Hash "descartável" (bcrypt de string aleatória) para gastar tempo mesmo quando
// o e-mail não existe — evita enumeração de usuários por diferença de tempo.
const DUMMY_HASH = "$2b$12$z7as2ERQOZBUPTL7Fmnd0elzA13z7kDdL9zCb2i6.XMOea4LXdEGG";

export async function POST(req: Request) {
  const ip = clientIp(req);
  // Trava por IP: no máx. 8 tentativas/min. Brute-force fica inviável.
  const rl = rateLimit(`admin-login:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente de novo." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
    } | null;

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password || email.length > 254 || password.length > 200) {
      return NextResponse.json(
        { error: "Informe e-mail e senha válidos" },
        { status: 400 }
      );
    }

    // Trava adicional por e-mail: dificulta ataque distribuído em uma conta.
    const rlEmail = rateLimit(`admin-login-email:${email}`, 10, 5 * 60_000);
    if (!rlEmail.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas para esta conta. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const db = getDb();
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    // Sempre executa a verificação (tempo constante) para não vazar existência.
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !ok) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    await createAdminSession(user.id, user.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin-login]", err);
    return NextResponse.json({ error: "Erro no login" }, { status: 500 });
  }
}

export async function DELETE() {
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
