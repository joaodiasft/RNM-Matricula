import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Não revela o framework/versão nos cabeçalhos (reduz superfície de fingerprint).
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;

// Habilita bindings Cloudflare no `next dev` quando o pacote estiver disponível
try {
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
} catch {
  // ok em ambientes sem OpenNext
}
