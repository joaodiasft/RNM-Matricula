import { EnrollmentWizard } from "@/components/matricula/EnrollmentWizard";
import { COMPANY } from "@/lib/company";

export default function MatriculaPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-28 pt-6 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Matrícula online
        </p>
        <h1 className="font-display mt-2 text-4xl leading-none text-fg sm:text-5xl">
          {COMPANY.name}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Preencha em poucos passos. Seu progresso é salvo automaticamente —
          você pode fechar e continuar depois.
        </p>
      </header>

      <EnrollmentWizard />

      <footer className="mt-auto pt-10 text-center text-xs leading-relaxed text-muted">
        <p>{COMPANY.name} · CNPJ {COMPANY.cnpj}</p>
        <p>{COMPANY.address}</p>
        <p>
          {COMPANY.phone} · urgência {COMPANY.urgencyPhone}
        </p>
        <p>{COMPANY.email}</p>
      </footer>
    </main>
  );
}
