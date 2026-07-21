import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Camada de segurança de borda: injeta cabeçalhos de proteção em toda resposta.
 *
 * A CSP usa nonce por requisição + 'strict-dynamic' — o Next aplica o nonce
 * automaticamente aos seus próprios scripts ao ler a CSP no header da requisição.
 * Isso bloqueia XSS por injeção de <script>, mesmo que algum dado do usuário
 * escape a sanitização. Nada aqui depende de confiar no navegador do cliente.
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isProd = process.env.NODE_ENV === "production";

  const csp = [
    `default-src 'self'`,
    // 'strict-dynamic' faz o navegador confiar em scripts criados por scripts já confiáveis
    // (ex.: o loader do Cloudflare Turnstile). Host allowlist fica como fallback p/ navegadores antigos.
    // 'unsafe-eval' só em dev (HMR do Next/turbopack usa eval); em produção fica de fora.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'${
      isProd ? "" : " 'unsafe-eval'"
    }`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://challenges.cloudflare.com`,
    `frame-src 'self' https://challenges.cloudflare.com`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
    ...(isProd ? [`upgrade-insecure-requests`] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-dns-prefetch-control", "off");
  response.headers.set("x-permitted-cross-domain-policies", "none");
  response.headers.set("cross-origin-opener-policy", "same-origin");
  response.headers.set("cross-origin-resource-policy", "same-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  // Impede que respostas de API/rotas com PII fiquem em cache compartilhado.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("cache-control", "no-store, max-age=0");
  }
  if (isProd) {
    response.headers.set(
      "strict-transport-security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  // Aplica a todas as rotas, exceto assets estáticos e otimização de imagem.
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|logo-rnm.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
