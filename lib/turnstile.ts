/**
 * Cloudflare Turnstile (anti-robô).
 *
 * Comportamento:
 * - Sem TURNSTILE_SECRET_KEY → desligado (libera). Assim o formulário
 *   não trava em produção por má configuração de secrets.
 * - Com secret → exige token válido do widget (NEXT_PUBLIC_TURNSTILE_SITE_KEY).
 */
export async function verifyTurnstile(
  token: string | undefined | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    // Não configurado = anti-robô desligado (dev e produção).
    return true;
  }

  if (!token?.trim()) return false;

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token.trim());

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    if (!res.ok) {
      console.error("[turnstile] siteverify HTTP", res.status);
      return false;
    }
    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      console.error("[turnstile] rejeitado:", data["error-codes"] ?? data);
    }
    return Boolean(data.success);
  } catch (err) {
    console.error("[turnstile] falha ao verificar token:", err);
    return false;
  }
}

/** True quando o anti-robô está de fato exigido no servidor. */
export function isTurnstileRequired(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}
