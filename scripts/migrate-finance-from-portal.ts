/**
 * Migra cobranças legadas do Portal (Supabase) para o Neon da Matrícula.
 * Uso: npx tsx scripts/migrate-finance-from-portal.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config();
import { neon } from "@neondatabase/serverless";

const CHARGES: Array<{
  enrollment: string;
  type: string;
  status: string;
  description: string;
  amount: string;
  dueDate: string;
  paidAt: string | null;
  payment?: { amount: string; method: string; paidAt: string; reference: string | null };
}> = [
  {
    enrollment: "R0002",
    type: "MENSALIDADE",
    status: "PENDENTE",
    description: "Mensalidade setembro/2026",
    amount: "250.00",
    dueDate: "2026-09-05",
    paidAt: null,
  },
  {
    enrollment: "R0002",
    type: "MENSALIDADE",
    status: "PAGO",
    description: "Mensalidade agosto/2026",
    amount: "250.00",
    dueDate: "2026-08-12",
    paidAt: "2026-08-03T15:00:00.000Z",
    payment: {
      amount: "250.00",
      method: "PIX",
      paidAt: "2026-08-03T15:00:00.000Z",
      reference: null,
    },
  },
  {
    enrollment: "R0001",
    type: "MENSALIDADE",
    status: "PENDENTE",
    description: "Mensalidade — mês 2",
    amount: "220.00",
    dueDate: "2026-08-05",
    paidAt: null,
  },
  {
    enrollment: "R0001",
    type: "MENSALIDADE",
    status: "PAGO",
    description: "Mensalidade — mês 1",
    amount: "220.00",
    dueDate: "2026-07-01",
    paidAt: "2026-07-02T17:10:43.550Z",
    payment: {
      amount: "220.00",
      method: "PIX",
      paidAt: "2026-07-02T17:10:43.550Z",
      reference: "PIX-0002",
    },
  },
  {
    enrollment: "R0001",
    type: "MATRICULA",
    status: "PAGO",
    description: "Taxa de matrícula 2026",
    amount: "150.00",
    dueDate: "2026-06-01",
    paidAt: "2026-06-03T17:10:43.550Z",
    payment: {
      amount: "150.00",
      method: "PIX",
      paidAt: "2026-06-03T17:10:43.550Z",
      reference: "PIX-0001",
    },
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente");
  const sql = neon(url);

  await sql`CREATE TABLE IF NOT EXISTS financial_charges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    type text NOT NULL DEFAULT 'MENSALIDADE',
    status text NOT NULL DEFAULT 'PENDENTE',
    description text,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    paid_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS financial_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    charge_id uuid NOT NULL REFERENCES financial_charges(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    method text NOT NULL DEFAULT 'PIX',
    paid_at timestamptz DEFAULT now(),
    reference text,
    created_at timestamptz DEFAULT now()
  )`;

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM financial_charges`;
  if (Number(count) > 0) {
    console.log(`Já existem ${count} cobrança(s). Nada a migrar.`);
    return;
  }

  let inserted = 0;
  for (const c of CHARGES) {
    const enrs = await sql`
      SELECT id FROM enrollments WHERE enrollment_number = ${c.enrollment} LIMIT 1
    `;
    if (!enrs[0]) {
      console.warn(`Matrícula ${c.enrollment} não encontrada — pulando ${c.description}`);
      continue;
    }
    const enrollmentId = enrs[0].id as string;
    const rows = await sql`
      INSERT INTO financial_charges (enrollment_id, type, status, description, amount, due_date, paid_at)
      VALUES (
        ${enrollmentId},
        ${c.type},
        ${c.status},
        ${c.description},
        ${c.amount},
        ${c.dueDate},
        ${c.paidAt}
      )
      RETURNING id
    `;
    const chargeId = rows[0].id as string;
    if (c.payment) {
      await sql`
        INSERT INTO financial_payments (charge_id, amount, method, paid_at, reference)
        VALUES (
          ${chargeId},
          ${c.payment.amount},
          ${c.payment.method},
          ${c.payment.paidAt},
          ${c.payment.reference}
        )
      `;
    }
    inserted += 1;
  }
  console.log(`Migradas ${inserted} cobrança(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
