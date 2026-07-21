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
  referralSource: text("referral_source"),
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

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  subject: text("subject").notNull(),
  weekday: text("weekday").notNull(),
  schedule: text("schedule").notNull(),
  gradeRange: text("grade_range"),
  maxSeats: integer("max_seats").notNull().default(15),
  seatsTaken: integer("seats_taken").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").references(() => students.id, {
      onDelete: "cascade",
    }),
    sessionToken: text("session_token").notNull(),
    editToken: text("edit_token"),
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
    emailVerified: boolean("email_verified").default(false),
    emailOtpCode: text("email_otp_code"),
    emailOtpExpiresAt: timestamp("email_otp_expires_at", {
      withTimezone: true,
    }),
    obligationStatus: text("obligation_status").default("pendente"),
    obligationDeadline: date("obligation_deadline"),
    obligationDivulged: boolean("obligation_divulged"),
    obligationBroughtStudent: boolean("obligation_brought_student"),
    referralCodeUsed: text("referral_code_used"),
    lastActivityAt: timestamp("last_activity_at", {
      withTimezone: true,
    }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    declarationName: text("declaration_name"),
    declarationIp: text("declaration_ip"),
    declarationAt: timestamp("declaration_at", { withTimezone: true }),
    draftData: text("draft_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("enrollments_session_token_idx").on(t.sessionToken),
    uniqueIndex("enrollments_edit_token_idx").on(t.editToken),
  ]
);

export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  classCode: text("class_code").notNull(),
  studentId: uuid("student_id").references(() => students.id, {
    onDelete: "cascade",
  }),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id, {
    onDelete: "cascade",
  }),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const enrollmentCourses = pgTable(
  "enrollment_courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .references(() => enrollments.id, { onDelete: "cascade" })
      .notNull(),
    subject: text("subject").notNull(),
    classCode: text("class_code").notNull(),
    onWaitlist: boolean("on_waitlist").default(false),
  },
  (t) => [
    uniqueIndex("enrollment_courses_subject_idx").on(t.enrollmentId, t.subject),
  ]
);

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerEnrollmentId: uuid("referrer_enrollment_id").references(
    () => enrollments.id,
    { onDelete: "cascade" }
  ),
  code: text("code").notNull().unique(),
  referredEnrollmentId: uuid("referred_enrollment_id").references(
    () => enrollments.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

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
