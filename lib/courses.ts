export type Subject = "redacao" | "exatas" | "matematica";
export type EducationLevel = "fundamental" | "medio";

export type ClassInfo = {
  code: string;
  subject: Subject;
  level: EducationLevel;
  label: string;
  day: string;
  schedule: string;
  duration: string;
  grades?: string[];
};

export const CLASSES: ClassInfo[] = [
  {
    code: "R1",
    subject: "redacao",
    level: "medio",
    label: "Redação — Ensino Médio",
    day: "Terça",
    schedule: "18h00 – 19h30",
    duration: "1h30",
  },
  {
    code: "R2",
    subject: "redacao",
    level: "medio",
    label: "Redação — Ensino Médio",
    day: "Terça",
    schedule: "19h30 – 21h00",
    duration: "1h30",
  },
  {
    code: "R3",
    subject: "redacao",
    level: "medio",
    label: "Redação — Ensino Médio",
    day: "Sábado",
    schedule: "07h30 – 09h00",
    duration: "1h30",
  },
  {
    code: "R4",
    subject: "redacao",
    level: "medio",
    label: "Redação — Ensino Médio",
    day: "Sábado",
    schedule: "09h00 – 10h30",
    duration: "1h30",
  },
  {
    code: "R5",
    subject: "redacao",
    level: "fundamental",
    label: "Redação — 6º e 7º ano",
    day: "Sábado",
    schedule: "10h30 – 12h00",
    duration: "1h30",
    grades: ["6º ano", "7º ano"],
  },
  {
    code: "R6",
    subject: "redacao",
    level: "fundamental",
    label: "Redação — 8º e 9º ano",
    day: "Sábado",
    schedule: "15h00 – 16h30",
    duration: "1h30",
    grades: ["8º ano", "9º ano"],
  },
  {
    code: "EX1",
    subject: "exatas",
    level: "medio",
    label: "Exatas (Física, Matemática, Química)",
    day: "Segunda",
    schedule: "19h00 – 22h00",
    duration: "3h (≈1h por matéria)",
  },
  {
    code: "MF1",
    subject: "matematica",
    level: "fundamental",
    label: "Matemática Específica — Ensino Fundamental",
    day: "Sábado",
    schedule: "13h30 – 14h30",
    duration: "1h",
  },
];

export const GRADES = [
  "6º ano",
  "7º ano",
  "8º ano",
  "9º ano",
  "1ª série EM",
  "2ª série EM",
  "3ª série EM",
] as const;

export type Grade = (typeof GRADES)[number];

export function isFundamentalGrade(grade: string): boolean {
  return ["6º ano", "7º ano", "8º ano", "9º ano"].includes(grade);
}

export function isMedioGrade(grade: string): boolean {
  return ["1ª série EM", "2ª série EM", "3ª série EM"].includes(grade);
}

export function getAvailableClasses(grade: string): ClassInfo[] {
  const fundamental = isFundamentalGrade(grade);
  const medio = isMedioGrade(grade);

  return CLASSES.filter((c) => {
    if (fundamental && c.level === "fundamental") {
      if (c.grades) return c.grades.includes(grade);
      return true;
    }
    if (medio && c.level === "medio") return true;
    return false;
  });
}

export function getClassByCode(code: string): ClassInfo | undefined {
  return CLASSES.find((c) => c.code === code);
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  redacao: "Redação",
  exatas: "Exatas",
  matematica: "Matemática",
};

export const SUBJECT_INFO: Record<Subject, string> = {
  redacao:
    "Cada aula tem 1h30 de duração. Se for faltar, avise com 3 horas de antecedência para reagendarmos a reposição. Avisos são publicados no grupo — fique bem atento.",
  exatas:
    "Cada aula tem 1h de duração. Este curso não tem reposição, a não ser que os professores marquem uma. Avisos são publicados no grupo — fique bem atento.",
  matematica:
    "Cada aula tem 1h de duração. Avisos são publicados no grupo — fique bem atento.",
};
