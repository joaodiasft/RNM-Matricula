import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name"),
  birthDate: date("birth_date"),
  email: text("email"),
  phone: text("phone"),
  grade: text("grade"),
  school: text("school"),
  cpf: text("cpf"),
  rg: text("rg"),
  address: text("address"),
  lgpdConsent: boolean("lgpd_consent").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const guardians = pgTable("guardians", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  fatherName: text("father_name"),
  fatherPhone: text("father_phone"),
  motherName: text("mother_name"),
  motherPhone: text("mother_phone"),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").references(() => students.id, {
      onDelete: "cascade",
    }),
    sessionToken: text("session_token").notNull(),
    status: text("status").notNull().default("em_andamento"),
    currentStep: integer("current_step").notNull().default(1),
    modality: text("modality"),
    plan: text("plan"),
    paymentMethod: text("payment_method"),
    autoRenew: boolean("auto_renew").default(false),
    courseInfoAck: boolean("course_info_ack").default(false),
    finalNoticesAck: text("final_notices_ack"),
    monthlyValue: numeric("monthly_value", { precision: 10, scale: 2 }),
    planTotal: numeric("plan_total", { precision: 10, scale: 2 }),
    enrollmentFee: numeric("enrollment_fee", { precision: 10, scale: 2 }),
    abandonedNotified: boolean("abandoned_notified").default(false),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    declarationName: text("declaration_name"),
    declarationIp: text("declaration_ip"),
    declarationAt: timestamp("declaration_at", { withTimezone: true }),
    draftData: text("draft_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("enrollments_session_token_idx").on(t.sessionToken)]
);

export const enrollmentCourses = pgTable(
  "enrollment_courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .references(() => enrollments.id, { onDelete: "cascade" })
      .notNull(),
    subject: text("subject").notNull(),
    classCode: text("class_code").notNull(),
  },
  (t) => [
    uniqueIndex("enrollment_courses_subject_idx").on(t.enrollmentId, t.subject),
  ]
);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Secretaria"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminUserId: uuid("admin_user_id").references(() => adminUsers.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  meta: text("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const dailyExports = pgTable("daily_exports", {
  id: uuid("id").defaultRandom().primaryKey(),
  exportDate: date("export_date").notNull(),
  r2Key: text("r2_key"),
  fileName: text("file_name").notNull(),
  rowCount: integer("row_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
