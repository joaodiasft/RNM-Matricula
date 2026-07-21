import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { enrollments } from "./db/schema";

export async function countEnrollmentsSince(since: Date) {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(
      and(eq(enrollments.status, "concluida"), gte(enrollments.completedAt, since))
    );
  return result[0]?.count ?? 0;
}
