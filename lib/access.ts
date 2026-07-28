import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { enrollmentAccesses } from "./db/schema";
import { COMPANY } from "./company";

/**
 * Acessos gerados por matrícula.
 *
 * São credenciais para PLATAFORMAS EXTERNAS (Sistema do aluno, portal do
 * responsável, Sofia e Correção). Geradas com senha padrão, editáveis pela
 * secretaria e entregues junto com a confirmação (e-mail + WhatsApp).
 * Não são login deste app.
 */

export const DEFAULT_PASSWORD = "123456";
export const CORRECAO_EMAIL = COMPANY.email; // naredacaonota1000@gmail.com
export const CORRECAO_PASSWORD = "EUSOU1000";
export const RMIL_DOMAIN = "rmil.com";

export type AccessSet = {
  sistemaLogin: string;
  sistemaPassword: string;
  responsavelLogin: string;
  responsavelPassword: string;
  sofiaLogin: string;
  sofiaPassword: string;
  correcaoLogin: string;
  correcaoPassword: string;
};

export const ACCESS_SYSTEMS: {
  key: "sistema" | "responsavel" | "sofia" | "correcao";
  label: string;
  hint: string;
}[] = [
  { key: "sistema", label: "Sistema (aluno)", hint: "Usuário é o número de matrícula" },
  { key: "responsavel", label: "Responsável", hint: "Usuário do responsável principal" },
  { key: "sofia", label: "Sofia", hint: "Plataforma Sofia" },
  { key: "correcao", label: "Correção", hint: "Acesso compartilhado de correção" },
];

/** "João Pedro da Silva" → "joao.silva" (primeiro.ultimo, sem acento). */
export function slugName(fullName: string | null | undefined): string {
  const parts = (fullName || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "aluno";
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
}

export function formatEnrollmentNumber(n: number): string {
  return `R${String(n).padStart(4, "0")}`;
}

/** Mensagem pronta para colar no WhatsApp com os acessos do aluno. */
export function buildAccessMessage(input: {
  studentName: string;
  enrollmentNumber: string;
  accesses: AccessSet;
}): string {
  const a = input.accesses;
  return [
    `📋 *${COMPANY.name}* — Dados de acesso`,
    ``,
    `👤 Aluno: ${input.studentName}`,
    `🎫 Matrícula: ${input.enrollmentNumber}`,
    ``,
    `🔐 *Sistema (aluno)*`,
    `Usuário: ${a.sistemaLogin}`,
    `Senha: ${a.sistemaPassword}`,
    ``,
    `🔐 *Responsável*`,
    `Usuário: ${a.responsavelLogin}`,
    `Senha: ${a.responsavelPassword}`,
    ``,
    `🔐 *Sofia*`,
    `Usuário: ${a.sofiaLogin}`,
    `Senha: ${a.sofiaPassword}`,
    ``,
    `🔐 *Correção*`,
    `Usuário: ${a.correcaoLogin}`,
    `Senha: ${a.correcaoPassword}`,
    ``,
    `Guarde estes dados. Recomendamos trocar as senhas no primeiro acesso.`,
  ].join("\n");
}

/** Monta o conjunto padrão de acessos a partir dos nomes. */
export function buildAccessSet(input: {
  enrollmentNumber: string;
  studentName: string;
  principalName: string;
}): AccessSet {
  const studentSlug = slugName(input.studentName);
  const principalSlug = slugName(input.principalName || input.studentName);
  return {
    sistemaLogin: input.enrollmentNumber,
    sistemaPassword: DEFAULT_PASSWORD,
    responsavelLogin: `${principalSlug}@${RMIL_DOMAIN}`,
    responsavelPassword: DEFAULT_PASSWORD,
    sofiaLogin: `${studentSlug}@${RMIL_DOMAIN}`,
    sofiaPassword: DEFAULT_PASSWORD,
    correcaoLogin: CORRECAO_EMAIL,
    correcaoPassword: CORRECAO_PASSWORD,
  };
}

// ── Schema em runtime (idempotente) ────────────────────────────────────────
// Segue o padrão de "ensure" do projeto: cria a sequência de número de
// matrícula, a coluna e a tabela de acessos se ainda não existirem. Assim o
// recurso funciona em produção mesmo sem um passo manual de migração.
let accessSchemaReady = false;

export async function ensureAccessSchema() {
  if (accessSchemaReady) return;
  const db = getDb();
  try {
    await db.execute(
      sql`CREATE SEQUENCE IF NOT EXISTS enrollment_number_seq START 1`
    );
    await db.execute(
      sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrollment_number text`
    );
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS enrollments_enrollment_number_idx ON enrollments (enrollment_number)`
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS enrollment_accesses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      sistema_login text,
      sistema_password text,
      responsavel_login text,
      responsavel_password text,
      sofia_login text,
      sofia_password text,
      correcao_login text,
      correcao_password text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS enrollment_accesses_enrollment_idx ON enrollment_accesses (enrollment_id)`
    );
    accessSchemaReady = true;
  } catch (err) {
    // Corrida entre isolates concorrentes pode disparar "already exists".
    // Não é fatal — na próxima chamada o IF NOT EXISTS já encontra tudo pronto.
    console.error("[access] ensureAccessSchema:", err);
  }
}

/** Próximo número de matrícula (R0001, R0002, …) via sequência do Postgres. */
export async function nextEnrollmentNumber(): Promise<string> {
  const db = getDb();
  const res = await db.execute(
    sql`SELECT nextval('enrollment_number_seq')::int AS n`
  );
  const rows = (res as unknown as { rows?: { n: number | string }[] }).rows;
  const n = rows?.[0]?.n != null ? Number(rows[0].n) : NaN;
  return formatEnrollmentNumber(Number.isFinite(n) && n > 0 ? n : 1);
}

/** Cria os acessos da matrícula se ainda não existirem (idempotente). */
export async function ensureEnrollmentAccesses(
  enrollmentId: string,
  set: AccessSet
): Promise<void> {
  const db = getDb();
  const [existing] = await db
    .select({ id: enrollmentAccesses.id })
    .from(enrollmentAccesses)
    .where(eq(enrollmentAccesses.enrollmentId, enrollmentId))
    .limit(1);
  if (existing) return;
  await db.insert(enrollmentAccesses).values({ enrollmentId, ...set });
}

export async function getEnrollmentAccesses(
  enrollmentId: string
): Promise<AccessSet | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(enrollmentAccesses)
    .where(eq(enrollmentAccesses.enrollmentId, enrollmentId))
    .limit(1);
  if (!row) return null;
  return {
    sistemaLogin: row.sistemaLogin ?? "",
    sistemaPassword: row.sistemaPassword ?? "",
    responsavelLogin: row.responsavelLogin ?? "",
    responsavelPassword: row.responsavelPassword ?? "",
    sofiaLogin: row.sofiaLogin ?? "",
    sofiaPassword: row.sofiaPassword ?? "",
    correcaoLogin: row.correcaoLogin ?? "",
    correcaoPassword: row.correcaoPassword ?? "",
  };
}

/** Salva/atualiza os acessos editados pela secretaria (upsert por matrícula). */
export async function saveEnrollmentAccesses(
  enrollmentId: string,
  set: AccessSet
): Promise<void> {
  const db = getDb();
  const [existing] = await db
    .select({ id: enrollmentAccesses.id })
    .from(enrollmentAccesses)
    .where(eq(enrollmentAccesses.enrollmentId, enrollmentId))
    .limit(1);
  if (existing) {
    await db
      .update(enrollmentAccesses)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(enrollmentAccesses.id, existing.id));
  } else {
    await db.insert(enrollmentAccesses).values({ enrollmentId, ...set });
  }
}
