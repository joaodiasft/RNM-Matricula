/**
 * Plataformas externas usadas pelos alunos (links + credenciais padrão).
 *
 * Módulo PURO (sem acesso a banco) para poder ser importado tanto no servidor
 * quanto em componentes client. As credenciais da Coredação são as MESMAS para
 * todos os alunos; Sistema e Sofia são por aluno (vêm dos acessos gerados).
 */

export const PLATFORM_LINKS = {
  /** Portal unificado (aluno + professor) em redacaonotamil.site. */
  sistema: "https://redacaonotamil.site/login",
  sofia: "https://app.plataformasofia.com.br/",
  coredacao: "https://aluno.coredacao.com/",
} as const;

/** Login/senha fixos da Coredação — iguais para todos os alunos. */
export const COREDACAO_DEFAULT = {
  email: "naredacaonota1000@gmail.com",
  password: "EUSOU1000",
} as const;
