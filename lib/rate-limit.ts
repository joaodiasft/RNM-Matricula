/**
 * Rate limit simples em memória (por chave/IP). Em Workers multi-isolate o
 * limite é best-effort por isolate — suficiente para conter abuso/brute-force.
 *
 * IMPORTANTE (evento presencial): num mutirão de matrículas todas as famílias
 * saem pelo MESMO IP público (NAT do Wi-Fi). Por isso os limites de fluxo de
 * matrícula têm folga generosa; a proteção forte fica no login admin e no
 * anti-robô (Turnstile).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Varre e remove buckets expirados de tempos em tempos para o Map não crescer
// indefinidamente sob tráfego alto (evita vazamento de memória no isolate).
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { ok: boolean; remaining: number } {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
