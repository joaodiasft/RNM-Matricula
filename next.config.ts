import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Não revela o framework/versão nos cabeçalhos (reduz superfície de fingerprint).
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;

// Habilita bindings Cloudflare no `next dev` quando o pacote estiver disponível
try {
  // require síncrono é intencional: o next.config é avaliado de forma síncrona
  // e o pacote pode não existir fora do runtime Cloudflare.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
} catch {
  // ok em ambientes sem OpenNext
}
