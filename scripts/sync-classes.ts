import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { classes } from "../lib/db/schema";
import { seedClassRows } from "../lib/v2-helpers";

async function main() {
  const db = getDb();
  for (const row of seedClassRows()) {
    await db
      .update(classes)
      .set({
        weekday: row.weekday,
        schedule: row.schedule,
        subject: row.subject,
        gradeRange: row.gradeRange,
        updatedAt: new Date(),
      })
      .where(eq(classes.code, row.code));
    console.log(`OK ${row.code}: ${row.weekday} ${row.schedule}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
