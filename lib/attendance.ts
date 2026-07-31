/**
 * Chamada por turma — dados no banco de matrículas.
 * Lista alunos com matrícula concluída na turma (não lista de espera).
 */
import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { enrollments, students } from "@/lib/db/schema";

export type AttendanceStatus = "presente" | "falta" | "justificada";

export const classAttendance = pgTable(
  "class_attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classCode: text("class_code").notNull(),
    lessonDate: date("lesson_date").notNull(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    enrollmentId: uuid("enrollment_id").references(() => enrollments.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("falta"),
    /** Entrega de redação (turmas de redação) ou atividade. */
    assignmentDone: boolean("assignment_done").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("class_attendance_unique_idx").on(
      t.classCode,
      t.lessonDate,
      t.studentId
    ),
  ]
);

let attendanceReady = false;

export async function ensureAttendanceSchema() {
  if (attendanceReady) return;
  const db = getDb();
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS class_attendance (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        class_code text NOT NULL,
        lesson_date date NOT NULL,
        student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        enrollment_id uuid REFERENCES enrollments(id) ON DELETE SET NULL,
        status text NOT NULL DEFAULT 'falta',
        assignment_done boolean NOT NULL DEFAULT false,
        updated_at timestamptz DEFAULT now(),
        created_at timestamptz DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS class_attendance_unique_idx
      ON class_attendance (class_code, lesson_date, student_id)
    `);
    attendanceReady = true;
  } catch (err) {
    console.error("[attendance] ensureAttendanceSchema:", err);
  }
}

/** "04/08" + ano → "2026-08-04" */
export function scheduleDateToIso(ddmm: string, year = 2026): string {
  const m = /^(\d{2})\/(\d{2})$/.exec(ddmm.trim());
  if (!m) return "";
  return `${year}-${m[2]}-${m[1]}`;
}

export function isoToScheduleLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
