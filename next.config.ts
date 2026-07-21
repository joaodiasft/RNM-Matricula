import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Habilita bindings Cloudflare no `next dev` quando o pacote estiver disponível
try {
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
} catch {
  // ok em ambientes sem OpenNext
}
