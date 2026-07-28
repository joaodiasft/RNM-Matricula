"use client";

import { useState } from "react";
import Image from "next/image";
import { COMPANY } from "@/lib/company";
import type { Subject } from "@/lib/courses";
import { PIX_EXATAS, PIX_REDACAO, type PixPayment } from "@/lib/payments";

type Props = {
  subjects: Subject[];
};

const WA_COMPROVANTE = `https://wa.me/${COMPANY.phoneDigits}?text=${encodeURIComponent(
  "Olá! Segue o comprovante do pagamento da minha matrícula na Redação Nota Mil."
)}`;

export function PaymentChoice({ subjects }: Props) {
  const [mode, setMode] = useState<"pix" | "whats" | null>(null);

  const hasRedacao = subjects.includes("redacao");
  const hasExatas =
    subjects.includes("exatas") || subjects.includes("matematica");

  const blocks: PixPayment[] = [
    ...(hasRedacao ? [PIX_REDACAO] : []),
    ...(hasExatas ? [PIX_EXATAS] : []),
  ];
  // Se por algum motivo não houver correspondência, mostra os dois.
  const pixBlocks = blocks.length ? blocks : [PIX_REDACAO, PIX_EXATAS];

  return (
    <div className="mb-6 rounded-2xl border border-line bg-bg-subtle p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        Pagamento
      </p>
      <h3 className="font-display mt-1 text-lg font-bold text-ink">
        Como você prefere pagar?
      </h3>
      <p className="mt-1 text-sm text-muted">
        Pague agora pelo PIX ou receba as informações pelo WhatsApp.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("pix")}
          aria-pressed={mode === "pix"}
          className={`min-h-[52px] rounded-xl border px-4 py-3 text-sm font-bold transition ${
            mode === "pix"
              ? "border-brand bg-brand text-white shadow-[var(--shadow-brand)]"
              : "border-line bg-white text-ink hover:border-brand/40"
          }`}
        >
          Pagar via PIX
        </button>
        <button
          type="button"
          onClick={() => setMode("whats")}
          aria-pressed={mode === "whats"}
          className={`min-h-[52px] rounded-xl border px-4 py-3 text-sm font-bold transition ${
            mode === "whats"
              ? "border-[#128C7E] bg-[#25D366] text-white"
              : "border-line bg-white text-ink hover:border-[#25D366]/50"
          }`}
        >
          Receber no WhatsApp
        </button>
      </div>

      {mode === "pix" && (
        <div className="mt-5 space-y-4">
          {pixBlocks.map((p) => (
            <PixCard key={p.id} pix={p} />
          ))}

          <div className="rounded-xl bg-brand-tint px-4 py-3 text-sm text-ink-soft ring-1 ring-brand/15">
            Depois de pagar, <strong>envie o comprovante no WhatsApp</strong> para
            a equipe confirmar sua matrícula.
          </div>

          <a
            href={WA_COMPROVANTE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-3.5 text-center text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(37,211,102,0.55)] transition hover:brightness-[0.97] active:scale-[0.99]"
          >
            <WhatsIcon />
            Enviar comprovante no WhatsApp
          </a>
        </div>
      )}

      {mode === "whats" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-brand-tint px-4 py-3 text-sm text-ink-soft ring-1 ring-brand/15">
            Sem problema! Fale com a equipe pelo WhatsApp que enviamos as
            informações de pagamento e tiramos suas dúvidas.
          </div>
          <a
            href={WA_COMPROVANTE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-3.5 text-center text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(37,211,102,0.55)] transition hover:brightness-[0.97] active:scale-[0.99]"
          >
            <WhatsIcon />
            Falar no WhatsApp
          </a>
          <p className="text-center text-xs text-muted">{COMPANY.phone}</p>
        </div>
      )}
    </div>
  );
}

function PixCard({ pix }: { pix: PixPayment }) {
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(pix.keyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard indisponível — o valor continua visível para digitar */
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">PIX — {pix.title}</p>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-deep">
          {pix.bank}
        </span>
      </div>

      <div className="mt-3 flex justify-center">
        <div className="rounded-xl border border-line bg-white p-3">
          {/* QR oficial — servido sem reprocessamento (unoptimized). NÃO alterar. */}
          <Image
            src={pix.qr}
            alt={`QR code PIX — ${pix.title}`}
            width={280}
            height={280}
            unoptimized
            priority
            className="h-auto w-[220px] max-w-full"
          />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Abra o app do seu banco e leia o QR code, ou use a chave abaixo.
      </p>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-bg-subtle px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              {pix.keyLabel} (chave PIX)
            </p>
            <p className="data mt-0.5 truncate text-sm font-semibold text-ink">
              {pix.keyValue}
            </p>
          </div>
          <button
            type="button"
            onClick={copyKey}
            className="shrink-0 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink-soft transition hover:border-brand/40 hover:text-brand"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <p className="px-1 text-xs text-muted">{pix.note}</p>
      </div>
    </div>
  );
}

function WhatsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.6 15.06L2 22l5.06-1.33A10 10 0 1 0 12 2zm0 18.2a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3 .79.8-2.93-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}
