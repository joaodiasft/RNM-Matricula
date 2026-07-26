import Image from "next/image";

type LogoProps = {
  variant?: "onDark" | "onLight";
  className?: string;
  priority?: boolean;
  title?: string;
};

/**
 * Logo oficial (`logocerta.png` recortada, 2×).
 * Cores originais preservadas — use sobre fundo claro.
 * Em hero escuro, o wrapper `.hero-logo-plate` dá o fundo claro.
 */
export function Logo({
  variant = "onLight",
  className = "h-auto w-[220px]",
  priority = false,
  title = "Redação 1000 — Curso Preparatório",
}: LogoProps) {
  // Mesmo asset: a marca é escura e precisa de fundo claro
  void variant;

  return (
    <Image
      src="/logo-rnm.png"
      alt={title}
      width={1970}
      height={1226}
      priority={priority}
      className={className}
    />
  );
}
