"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { EnrollmentWizard } from "@/components/matricula/EnrollmentWizard";
import { Logo } from "@/components/brand/Logo";
import { COMPANY } from "@/lib/company";

const TRUST = [
  {
    label: "Progresso salvo",
    icon: (
      <path d="M7 18a5 5 0 0 1-.4-10 7 7 0 0 1 13.5 2A4.5 4.5 0 0 1 18 18H7zM9.5 13l1.8 1.8 3.7-3.8" />
    ),
  },
  {
    label: "Dados protegidos",
    icon: (
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zm-1.5 9.5l4-4M9 12l1.5 1.5" />
    ),
  },
  {
    label: "Poucos minutos",
    icon: <path d="M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" />,
  },
];

export default function MatriculaPage() {
  const router = useRouter();
  const taps = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const secretAdminTap = () => {
    taps.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      taps.current = 0;
    }, 1800);
    if (taps.current >= 5) {
      taps.current = 0;
      router.push("/admin/login");
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-32 pt-4 sm:px-6 sm:pt-6">
      <div className="hero-stage animate-rise mb-5 sm:mb-6">
        <div className="hero-blob hero-blob--rosa" aria-hidden />
        <div className="hero-blob hero-blob--gold" aria-hidden />
        <div className="hero-blob hero-blob--ink" aria-hidden />

        <header className="hero-glass overflow-hidden rounded-[var(--radius-xl)]">
          <div className="hero-logo-wrap">
            <div className="hero-logo-plate">
              <Logo
                variant="onLight"
                priority
                className="hero-logo-img"
              />
            </div>
          </div>

          <div className="px-5 pb-6 pt-4 sm:px-7 sm:pb-7 sm:pt-5">
            <p className="hero-label text-[10px] font-semibold uppercase tracking-[0.22em]">
              Matrícula online
            </p>
            <h1 className="font-display mt-2 text-[1.85rem] font-bold leading-[1.06] tracking-[-0.03em] text-white sm:text-[2.15rem]">
              Faça sua matrícula
            </h1>
            <p className="mt-2 max-w-md text-[0.9rem] leading-relaxed text-white/70">
              Poucos passos, progresso salvo automaticamente. Feche e continue
              quando quiser.
            </p>

            <ul className="hero-trust" aria-label="Vantagens da matrícula online">
              {TRUST.map((t) => (
                <li key={t.label}>
                  <svg
                    className="h-3.5 w-3.5"
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
                  {t.label}
                </li>
              ))}
            </ul>
          </div>
        </header>
      </div>

      <EnrollmentWizard />

      <footer className="mt-14 border-t border-line pt-8 text-center text-xs leading-relaxed text-muted">
        <button
          type="button"
          onClick={secretAdminTap}
          className="mx-auto mb-4 block cursor-default border-0 bg-transparent p-0"
          aria-label="Redação Nota Mil"
          title=""
        >
          <Logo
            variant="onLight"
            className="mx-auto h-auto w-[140px] opacity-95"
          />
        </button>
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
