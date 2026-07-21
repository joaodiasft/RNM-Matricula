import { z } from "zod";

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(cpf: string): boolean {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === Number(digits[10]);
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskDate(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Converte DD/MM/YYYY → YYYY-MM-DD */
export function brDateToIso(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm}-${dd}`;
  const date = new Date(`${iso}T12:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getDate() !== Number(dd) ||
    date.getMonth() + 1 !== Number(mm)
  ) {
    return null;
  }
  return iso;
}

export function isoToBrDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function calcAge(birthIso: string, today = new Date()): number | null {
  const d = new Date(`${birthIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function calcAgeFromBr(br: string): number | null {
  const iso = brDateToIso(br);
  if (!iso) return null;
  return calcAge(iso);
}

const phoneSchema = z
  .string()
  .min(1, "Telefone obrigatório")
  .refine((v) => onlyDigits(v).length >= 10 && onlyDigits(v).length <= 11, {
    message: "Telefone inválido",
  });

const optionalPhone = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => !v || onlyDigits(v).length === 0 || (onlyDigits(v).length >= 10 && onlyDigits(v).length <= 11),
    { message: "Telefone inválido" }
  );

export const studentStepSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo"),
  birthDateBr: z
    .string()
    .refine((v) => brDateToIso(v) !== null, { message: "Data inválida (DD/MM/AAAA)" }),
  email: z.string().email("E-mail inválido"),
  phone: phoneSchema,
  grade: z.string().min(1, "Selecione a série"),
  school: z.string().min(2, "Informe onde estuda"),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || onlyDigits(v).length === 0 || isValidCpf(v), {
      message: "CPF inválido",
    }),
  rg: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  lgpdConsent: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar o uso dos dados (LGPD)" }),
  }),
});

export const guardiansStepSchema = z
  .object({
    fatherName: z.string().optional().or(z.literal("")),
    fatherPhone: optionalPhone,
    motherName: z.string().optional().or(z.literal("")),
    motherPhone: optionalPhone,
  })
  .superRefine((data, ctx) => {
    const fatherOk =
      Boolean(data.fatherName?.trim()) &&
      Boolean(data.fatherPhone && onlyDigits(data.fatherPhone).length >= 10);
    const motherOk =
      Boolean(data.motherName?.trim()) &&
      Boolean(data.motherPhone && onlyDigits(data.motherPhone).length >= 10);
    if (!fatherOk && !motherOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preencha pelo menos um responsável (nome + telefone)",
        path: ["fatherName"],
      });
    }
  });

export const coursesStepSchema = z
  .object({
    courses: z
      .array(
        z.object({
          subject: z.enum(["redacao", "exatas", "matematica"]),
          classCode: z.string().min(1),
        })
      )
      .min(1, "Selecione pelo menos uma turma"),
  })
  .superRefine((data, ctx) => {
    const subjects = data.courses.map((c) => c.subject);
    if (new Set(subjects).size !== subjects.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Apenas uma turma por matéria",
        path: ["courses"],
      });
    }
  });

export type StudentStepData = z.infer<typeof studentStepSchema>;
export type GuardiansStepData = z.infer<typeof guardiansStepSchema>;
export type CoursesStepData = z.infer<typeof coursesStepSchema>;

export type EnrollmentDraft = {
  lgpdConsent?: boolean;
  fullName?: string;
  birthDateBr?: string;
  email?: string;
  phone?: string;
  grade?: string;
  school?: string;
  cpf?: string;
  rg?: string;
  address?: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  courses?: { subject: "redacao" | "exatas" | "matematica"; classCode: string }[];
  courseInfoAck?: boolean;
  modality?: "desconto" | "desconto_parcial" | "normal";
  plan?: "mensal" | "trimestral" | "total";
  paymentMethod?: "dinheiro" | "cartao" | "pix";
  autoRenew?: boolean;
  noticePayment?: boolean;
  noticeAbsence?: boolean;
  noticeModality?: boolean;
  confirmEmail?: string;
  confirmPhone?: string;
  declarationName?: string;
};
