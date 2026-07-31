/**
 * Schema Drizzle do banco RNM-Chamada (tabelas Prisma em PascalCase).
 * Só o necessário para a tela de chamada / presença.
 */
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const statusPresencaEnum = pgEnum("StatusPresenca", [
  "PRESENTE",
  "FALTA",
  "JUSTIFICADA",
]);

export const chamadaAlunos = pgTable("Aluno", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const chamadaMeses = pgTable(
  "Mes",
  {
    id: text("id").primaryKey(),
    nome: text("nome").notNull(),
    ano: integer("ano").notNull(),
  },
  (t) => [uniqueIndex("Mes_nome_ano_key").on(t.nome, t.ano)]
);

export const chamadaAlunoMes = pgTable(
  "AlunoMes",
  {
    id: text("id").primaryKey(),
    alunoId: text("alunoId").notNull(),
    mesId: text("mesId").notNull(),
    noGrupo: boolean("noGrupo").notNull().default(false),
    pago: boolean("pago").notNull().default(false),
  },
  (t) => [uniqueIndex("AlunoMes_alunoId_mesId_key").on(t.alunoId, t.mesId)]
);

export const chamadaModulos = pgTable(
  "Modulo",
  {
    id: text("id").primaryKey(),
    numero: integer("numero").notNull(),
    mesId: text("mesId").notNull(),
  },
  (t) => [uniqueIndex("Modulo_mesId_numero_key").on(t.mesId, t.numero)]
);

export const chamadaAulas = pgTable(
  "Aula",
  {
    id: text("id").primaryKey(),
    numero: integer("numero").notNull(),
    data: timestamp("data", { mode: "date" }).notNull(),
    moduloId: text("moduloId").notNull(),
  },
  (t) => [uniqueIndex("Aula_moduloId_numero_key").on(t.moduloId, t.numero)]
);

export const chamadaPresencas = pgTable(
  "Presenca",
  {
    id: text("id").primaryKey(),
    alunoId: text("alunoId").notNull(),
    aulaId: text("aulaId").notNull(),
    status: statusPresencaEnum("status").notNull().default("FALTA"),
    redacaoEntregue: boolean("redacaoEntregue").notNull().default(false),
    atualizadoEm: timestamp("atualizadoEm", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("Presenca_alunoId_aulaId_key").on(t.alunoId, t.aulaId)]
);

export type StatusPresenca = "PRESENTE" | "FALTA" | "JUSTIFICADA";
