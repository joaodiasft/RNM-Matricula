import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { adminSettings, adminUsers } from "../lib/db/schema";
import { hashPassword } from "../lib/auth";

async function main() {
  const email = process.env.ADMIN_EMAIL || "naredacaonota1000@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "TroqueEstaSenhaForte123!";
  const cardFee = process.env.DEFAULT_CARD_FEE_PERCENT || "3.5";

  const db = getDb();
  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing.length === 0) {
    const passwordHash = await hashPassword(password);
    await db.insert(adminUsers).values({
      email,
      passwordHash,
      name: "Secretaria",
    });
    console.log(`Admin criado: ${email}`);
  } else {
    console.log(`Admin já existe: ${email}`);
  }

  const setting = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "card_machine_fee_percent"))
    .limit(1);

  if (setting.length === 0) {
    await db.insert(adminSettings).values({
      key: "card_machine_fee_percent",
      value: cardFee,
    });
    console.log(`Taxa maquininha definida: ${cardFee}%`);
  }

  console.log("Seed concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
