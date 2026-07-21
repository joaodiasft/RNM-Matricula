import { CLASSES } from "./courses";

export const DEFAULT_MAX_SEATS = 15;
export const OBLIGATION_DEADLINE_DAYS = 30;
export const OTP_TTL_MINUTES = 10;

export const REFERRAL_SOURCES = [
  { value: "indicacao", label: "Indicação de amigo/aluno" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "outro", label: "Outro" },
] as const;

export type ReferralSource = (typeof REFERRAL_SOURCES)[number]["value"];

export function seedClassRows() {
  return CLASSES.map((c) => ({
    code: c.code,
    subject: c.subject,
    weekday: c.day,
    schedule: c.schedule,
    gradeRange: c.grades?.join(", ") ?? (c.level === "medio" ? "EM" : "EF"),
    maxSeats: DEFAULT_MAX_SEATS,
    seatsTaken: 0,
  }));
}

export function generateReferralCode(fullName: string): string {
  const first =
    fullName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .split(/\s+/)[0]
      ?.toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 10) || "ALUNO";
  const num = Math.floor(100 + Math.random() * 900);
  return `${first}-RNM-${num}`;
}

export function generateOtpCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
