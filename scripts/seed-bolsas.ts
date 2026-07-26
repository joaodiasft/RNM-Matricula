import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { scholarshipCodes } from "../lib/db/schema";

const CODES = [
  "BOLSA-RNM-A7K2",
  "BOLSA-RNM-B9M4",
  "BOLSA-RNM-C3P8",
  "BOLSA-RNM-D5Q1",
  "BOLSA-RNM-E8T6",
  "BOLSA-RNM-F2W9",
  "BOLSA-RNM-G4X3",
  "BOLSA-RNM-H6Y7",
  "BOLSA-RNM-J1Z5",
  "BOLSA-RNM-K9N0",
];

async function main() {
  const db = getDb();
  for (const code of CODES) {
    const [existing] = await db
      .select()
      .from(scholarshipCodes)
      .where(eq(scholarshipCodes.code, code))
      .limit(1);
    if (existing) {
      console.log("já existe:", code);
      continue;
    }
    await db.insert(scholarshipCodes).values({
      code,
      label: "Bolsa integral",
    });
    console.log("criado:", code);
  }
  console.log("\n=== 10 CÓDIGOS DE BOLSA (uso único) ===");
  for (const c of CODES) console.log(c);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
