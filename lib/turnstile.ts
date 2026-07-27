export async function verifyTurnstile(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    // Em produção, falta de secret = FALHA FECHADA. Não deixamos o anti-robô
    // ser silenciosamente desligado por má configuração de ambiente.
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[turnstile] TURNSTILE_SECRET_KEY ausente em produção — bloqueando envio."
      );
      return false;
    }
    // Fora de produção (dev/preview local sem chave), libera para não travar testes.
    return true;
  }

  if (!token) return false;

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (err) {
    // Erro de rede ao validar → falha fechada (não deixa passar sem verificação).
    console.error("[turnstile] falha ao verificar token:", err);
    return false;
  }
}
