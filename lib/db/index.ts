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
    // fora do runtime Cloudflare
  }

  return undefined;
}

export function getDb() {
  const url = readEnv("DATABASE_URL");
  if (!url) {
    throw new Error("DATABASE_URL não configurada");
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export function getEnv(name: string, fallback = ""): string {
  return readEnv(name) ?? fallback;
}

export type Db = ReturnType<typeof getDb>;
