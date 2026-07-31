import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function readEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => { env?: Record<string, string | undefined> };
    };
    const env = getCloudflareContext()?.env;
    const value = env?.[name];
    if (typeof value === "string" && value) return value;
  } catch {
    /* fora do Cloudflare */
  }

  return undefined;
}

/** Banco Neon do RNM-Chamada (separado do banco de matrículas). */
export function getChamadaDb() {
  const url = readEnv("CHAMADA_DATABASE_URL");
  if (!url) {
    throw new Error(
      "CHAMADA_DATABASE_URL não configurada — aponte para o Neon do RNM-Chamada"
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export function hasChamadaDb(): boolean {
  return Boolean(readEnv("CHAMADA_DATABASE_URL"));
}
