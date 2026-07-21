import Image from "next/image";
import { EnrollmentWizard } from "@/components/matricula/EnrollmentWizard";
import { COMPANY } from "@/lib/company";

export default function MatriculaPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-28 pt-5 sm:px-6">
      <header className="mb-6 overflow-hidden rounded-[20px] bg-[#0a0a0a] px-5 py-6 shadow-[var(--shadow)] sm:px-7 sm:py-7">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
          <Image
            src="/logo-rnm.png"
            alt="Redação Nota Mil — Curso Preparatório"
            width={220}
            height={100}
            priority
            className="h-auto w-[180px] sm:w-[210px]"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e91e8c]">
              Matrícula online
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold leading-none text-white sm:text-4xl">
              Redação Nota Mil
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#c8c8ce]">
              Preencha em poucos passos. Seu progresso é salvo automaticamente —
              você pode fechar e continuar depois.
            </p>
          </div>
        </div>
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2e]">
          <div className="h-full w-2/5 rounded-full bg-[#e91e8c]" />
        </div>
      </header>

      <EnrollmentWizard />

      <footer className="mt-auto border-t border-line pt-8 text-center text-xs leading-relaxed text-muted">
        <p className="font-medium text-fg">{COMPANY.name}</p>
        <p>CNPJ {COMPANY.cnpj}</p>
        <p>{COMPANY.address}</p>
        <p>
          {COMPANY.phone} · urgência {COMPANY.urgencyPhone}
        </p>
        <p>{COMPANY.email}</p>
      </footer>
    </main>
  );
}
