/**
 * Grupos de avisos (WhatsApp) por turma.
 * `inviteUrl` fica vazio até você enviar o link — a estrutura já está pronta.
 * Pedido de entrada: aprovado somente após confirmação do pagamento.
 */
export type ClassGroupInfo = {
  classCode: string;
  groupName: string;
  /** Link de convite do WhatsApp — null = ainda não configurado */
  inviteUrl: string | null;
  /** Texto curto sobre o grupo */
  description: string;
};

export const CLASS_GROUPS: Record<string, ClassGroupInfo> = {
  R1: {
    classCode: "R1",
    groupName: "Avisos · Redação R1 (Terça)",
    inviteUrl: "https://chat.whatsapp.com/KgZcO6QP7oCHoySeAqbycM",
    description: "Avisos, materiais e comunicados da turma de terça.",
  },
  R2: {
    classCode: "R2",
    groupName: "Avisos · Redação R2 (Quinta)",
    inviteUrl: "https://chat.whatsapp.com/HmbuM9dbEGwBRgpcgwbvWR",
    description: "Avisos, materiais e comunicados da turma de quinta.",
  },
  R3: {
    classCode: "R3",
    groupName: "Avisos · Redação R3 (Sábado manhã)",
    inviteUrl: "https://chat.whatsapp.com/IE7EuGSPTEVBOacLYouu7B",
    description: "Avisos e materiais da turma de sábado 07h30.",
  },
  R4: {
    classCode: "R4",
    groupName: "Avisos · Redação R4 (Sábado)",
    inviteUrl: "https://chat.whatsapp.com/Iuob8vZ2WOe8yrQK3pHTKC",
    description: "Avisos e materiais da turma de sábado 09h00.",
  },
  R5: {
    classCode: "R5",
    groupName: "Avisos · Redação R5 (6º/7º)",
    inviteUrl: "https://chat.whatsapp.com/LXlMLiVGKqwA7wDACRwHeI",
    description: "Avisos e materiais da turma de 6º e 7º ano.",
  },
  R6: {
    classCode: "R6",
    groupName: "Avisos · Redação R6 (8º/9º)",
    inviteUrl: "https://chat.whatsapp.com/CYfk6PPEzMTEjKAjBIxxY7",
    description: "Avisos e materiais da turma de 8º e 9º ano.",
  },
  EX1: {
    classCode: "EX1",
    groupName: "Avisos · Exatas EX1",
    inviteUrl: "https://chat.whatsapp.com/LTJhbJ9uZ44AYEBQZvfA72",
    description: "Avisos, listas e comunicados de Exatas.",
  },
  MF1: {
    classCode: "MF1",
    groupName: "Avisos · Matemática MF1 (M1)",
    inviteUrl: "https://chat.whatsapp.com/ET6UW6UF5XqIdEzH8yHkit",
    description: "Avisos e listas da Matemática específica.",
  },
};

export function getGroupsForClassCodes(codes: string[]): ClassGroupInfo[] {
  const seen = new Set<string>();
  const out: ClassGroupInfo[] = [];
  for (const code of codes) {
    if (seen.has(code)) continue;
    seen.add(code);
    const g = CLASS_GROUPS[code];
    if (g) out.push(g);
  }
  return out;
}

export const GROUP_ACCESS_POLICY =
  "Seu pedido para entrar no grupo é analisado pela secretaria e só é aprovado após a confirmação do pagamento.";
