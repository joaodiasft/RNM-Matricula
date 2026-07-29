/**
 * Calendário de encontros por turma (datas informadas pela secretaria).
 *
 * As datas são agrupadas em MÓDULOS de 4 encontros. A secretaria escolhe o
 * módulo ao montar a mensagem de boas-vindas — assim o aluno recebe só as 4
 * datas do bloco atual, não o calendário inteiro.
 *
 * O dia da semana vem do código da turma (ver lib/courses.ts):
 *   R1 → Terça · R2 → Quinta · R3/R4/R5/R6 → Sábado · EX1 → Segunda · MF1 → Sábado
 */

export type ScheduleKey =
  | "R_TER"
  | "R_QUI"
  | "R_SAB"
  | "EX_SEG"
  | "MAT_SAB";

/** Datas exatamente como a secretaria passou (dd/mm). */
const SCHEDULE_DATES: Record<ScheduleKey, string[]> = {
  // Redação — Terça
  R_TER: [
    "04/08", "11/08", "18/08", "25/08",
    "01/09", "08/09", "15/09", "22/09", "29/09",
    "06/10", "13/10", "20/10", "27/10",
    "03/11",
  ],
  // Redação — Quinta
  R_QUI: [
    "06/08", "13/08", "20/08", "27/08",
    "03/09", "10/09", "17/09", "24/09",
    "01/10", "08/10", "15/10", "22/10", "29/10",
    "05/11",
  ],
  // Redação — Sábado
  R_SAB: [
    "08/08", "15/08", "22/08", "29/08",
    "05/09", "12/09", "19/09", "26/09",
    "03/10", "10/10", "17/10", "31/10",
    "07/11",
  ],
  // Exatas — Segunda
  EX_SEG: [
    "03/08", "10/08", "20/08", "27/08",
    "07/09", "14/09", "21/09", "28/09",
    "05/10", "12/10", "19/10", "26/10",
    "02/11", "09/11",
  ],
  // Matemática — Sábado (mesmo calendário da Redação de sábado)
  MAT_SAB: [
    "08/08", "15/08", "22/08", "29/08",
    "05/09", "12/09", "19/09", "26/09",
    "03/10", "10/10", "17/10", "31/10",
    "07/11",
  ],
};

const CLASS_TO_SCHEDULE: Record<string, ScheduleKey> = {
  R1: "R_TER",
  R2: "R_QUI",
  R3: "R_SAB",
  R4: "R_SAB",
  R5: "R_SAB",
  R6: "R_SAB",
  EX1: "EX_SEG",
  MF1: "MAT_SAB",
};

export function scheduleKeyForClass(classCode: string): ScheduleKey | null {
  return CLASS_TO_SCHEDULE[classCode] ?? null;
}

/** Divide o calendário em blocos de 4 (o último pode ter menos). */
function chunk4<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 4) out.push(arr.slice(i, i + 4));
  return out;
}

export type ClassModule = {
  index: number; // 1-based
  label: string; // "Módulo 1"
  dates: string[];
};

/** Módulos (blocos de 4 encontros) de uma turma. Vazio se turma sem calendário. */
export function getClassModules(classCode: string): ClassModule[] {
  const key = scheduleKeyForClass(classCode);
  if (!key) return [];
  return chunk4(SCHEDULE_DATES[key]).map((dates, i) => ({
    index: i + 1,
    label: `Módulo ${i + 1}`,
    dates,
  }));
}

/** Todas as datas do calendário da turma. */
export function getClassDates(classCode: string): string[] {
  const key = scheduleKeyForClass(classCode);
  return key ? SCHEDULE_DATES[key] : [];
}
