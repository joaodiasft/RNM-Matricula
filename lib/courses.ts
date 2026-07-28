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
    schedule: "18h45 – 20h15",
    duration: "1h30",
  },
  {
    code: "R2",
    subject: "redacao",
    level: "medio",
    label: "Redação — Ensino Médio",
    day: "Quinta",
    schedule: "18h45 – 20h15",
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

/** Valor especial para quem já saiu da escola e faz cursinho. */
export const CONCLUDED_GRADE = "Já concluí o Ensino Médio";
export const CONCLUDED_SCHOOL = "Ensino já concluído";

export function isConcludedGrade(grade: string): boolean {
  return grade === CONCLUDED_GRADE;
}

export function isFundamentalGrade(grade: string): boolean {
  return ["6º ano", "7º ano", "8º ano", "9º ano"].includes(grade);
}

export function isMedioGrade(grade: string): boolean {
  // Quem concluiu o EM faz cursinho → turmas de Ensino Médio.
  return (
    ["1ª série EM", "2ª série EM", "3ª série EM"].includes(grade) ||
    isConcludedGrade(grade)
  );
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

export const SUBJECT_INFO: Record<Subject, string[]> = {
  redacao: [
    "Cada aula tem 1h30 de duração, com foco em estrutura, repertório e correção.",
    "Se for faltar, avise a secretaria com pelo menos 3 horas de antecedência para agendar a reposição.",
    "Avisos, materiais e links saem no grupo oficial da turma — a entrada só é aprovada após o pagamento.",
    "Leve caderno ou tablet; a produção escrita faz parte de quase toda aula.",
  ],
  exatas: [
    "Cada aula tem 1h de duração, com resolução guiada e prática.",
    "Este curso não tem reposição automática — só quando os professores marcarem.",
    "Avisos e materiais são publicados no grupo oficial.",
    "Traga calculadora (se a turma indicar) e material para anotações.",
  ],
  matematica: [
    "Cada aula tem 1h de duração, com teoria objetiva e exercícios.",
    "Avisos, listas e links saem no grupo oficial — acompanhe sempre.",
    "Traga caderno e material de apoio indicado pelo professor.",
    "Em caso de dúvida sobre conteúdo, use o canal do grupo ou a secretaria.",
  ],
};
