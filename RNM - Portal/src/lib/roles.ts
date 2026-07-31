export type Role = "ADMIN" | "PROFESSOR" | "ALUNO" | "RESPONSAVEL";

/** Rota inicial de cada papel após o login. */
export function homeForRole(role: Role | string | null | undefined): string {
  switch (role) {
    case "PROFESSOR":
      return "/professor";
    case "ADMIN":
      return "/admin";
    case "ALUNO":
    case "RESPONSAVEL":
    default:
      return "/aluno";
  }
}

export function roleLabel(role: Role | string | null | undefined): string {
  switch (role) {
    case "ADMIN":
      return "Administração";
    case "PROFESSOR":
      return "Professor";
    case "RESPONSAVEL":
      return "Responsável";
    case "ALUNO":
    default:
      return "Aluno";
  }
}
