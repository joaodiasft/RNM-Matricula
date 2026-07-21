import Image from "next/image";
import { EnrollmentWizard } from "@/components/matricula/EnrollmentWizard";
import { COMPANY } from "@/lib/company";

const TRUST = [
  {
    label: "Progresso salvo",
    desc: "Feche e volte quando quiser",
    icon: (
      <path d="M7 18a5 5 0 0 1-.4-10 7 7 0 0 1 13.5 2A4.5 4.5 0 0 1 18 18H7zM9.5 13l1.8 1.8 3.7-3.8" />
    ),
  },
  {
    label: "Dados protegidos",
    desc: "Conexão segura · LGPD",
    icon: (
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zm-1.5 9.5l4-4M9 12l1.5 1.5" />
    ),
  },
  {
    label: "Poucos minutos",
    desc: "Passo a passo simples",
    icon: <path d="M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" />,
  },
];

export default function MatriculaPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-32 pt-4 sm:px-6 sm:pt-6">
      <header className="animate-rise hero-gradient mb-4 overflow-hidden rounded-[var(--radius-xl)] px-5 py-6 shadow-[var(--shadow-lg)] ring-1 ring-white/10 sm:mb-5 sm:px-7 sm:py-7">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0 rounded-2xl bg-black/35 p-2 ring-1 ring-white/10">
            <Image
              src="/logo-rnm.png"
              alt="Redação Nota Mil — Curso Preparatório"
              width={220}
              height={100}
              priority
              className="h-auto w-[140px] sm:w-[168px]"
            />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#ff9fd0] ring-1 ring-brand/35">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              Matrícula online
            </span>
            <h1 className="font-display mt-3 text-[1.85rem] font-extrabold leading-[1.08] text-white sm:text-[2.15rem]">
              Faça sua matrícula
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/68">
              Poucos passos, progresso salvo automaticamente. Feche e continue
              quando quiser.
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-2">
          {TRUST.map((t) => (
            <div
              key={t.label}
              className="rounded-xl bg-white/[0.07] px-2.5 py-2.5 ring-1 ring-white/10 sm:px-3"
            >
              <svg
                className="h-4 w-4 text-brand"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {t.icon}
              </svg>
              <dt className="mt-1.5 text-[11px] font-bold leading-tight text-white sm:text-xs">
                {t.label}
              </dt>
              <dd className="mt-0.5 hidden text-[10px] leading-tight text-white/50 sm:block">
                {t.desc}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <EnrollmentWizard />

      <footer className="mt-14 border-t border-line pt-8 text-center text-xs leading-relaxed text-muted">
        <Image
          src="/logo-rnm.png"
          alt=""
          width={120}
          height={54}
          className="mx-auto mb-4 h-auto w-[88px] rounded-xl bg-[#141417] p-1.5 opacity-90"
        />
        <p className="font-semibold text-ink-soft">{COMPANY.name}</p>
        <p className="mt-1">CNPJ {COMPANY.cnpj}</p>
        <p>{COMPANY.address}</p>
        <p className="mt-1.5">
          {COMPANY.phone} · urgência {COMPANY.urgencyPhone}
        </p>
        <p>{COMPANY.email}</p>
        <p className="mt-5 text-[11px] text-muted-2">
          Dados protegidos com conexão segura, usados apenas para a matrícula
          (LGPD).
        </p>
      </footer>
    </main>
  );
}
