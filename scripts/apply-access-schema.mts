/**
 * Aplica (uma vez) o schema aditivo dos acessos ao banco configurado:
 * - sequência enrollment_number_seq
 * - coluna enrollments.enrollment_number (+ índice único)
 * - tabela enrollment_accesses (+ índice único)
 *
 * Tudo idempotente (IF NOT EXISTS) e não destrutivo.
 * Uso: npx tsx scripts/apply-access-schema.mts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const { ensureAccessSchema } = await import("../lib/access");

await ensureAccessSchema();
console.log("✓ Schema de acessos aplicado (enrollment_number + enrollment_accesses).");
