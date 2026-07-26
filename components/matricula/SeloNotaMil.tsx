"use client";

/**
 * Selo Nota Mil — carimbo circular dourado com "1000" e um check.
 * Usado com moderação: conclusão de passo importante, tela de confirmação
 * final e card-resumo do WhatsApp. É o "uau" reservado.
 */
export function SeloNotaMil({
  size = 72,
  className = "",
  animate = true,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${
        animate ? "animate-selo" : ""
      } ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Selo Nota Mil"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_6px_14px_rgba(242,183,5,0.45)]" aria-hidden>
        <defs>
          <linearGradient id="selo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F7C948" />
            <stop offset="1" stopColor="#E0A900" />
          </linearGradient>
        </defs>
        {/* borda serrilhada do carimbo */}
        <circle cx="50" cy="50" r="47" fill="url(#selo-g)" />
        <circle cx="50" cy="50" r="47" fill="none" stroke="#B8890A" strokeWidth="1.5" strokeDasharray="2.6 2.6" opacity="0.7" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#14213D" strokeWidth="2" opacity="0.85" />
        {/* 1000 */}
        <text
          x="50"
          y="46"
          textAnchor="middle"
          fontFamily="var(--font-fraunces), Georgia, serif"
          fontWeight="900"
          fontSize="26"
          fill="#14213D"
          letterSpacing="-1"
        >
          1000
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontFamily="var(--font-inter), system-ui, sans-serif"
          fontWeight="700"
          fontSize="8.5"
          fill="#14213D"
          letterSpacing="2.5"
        >
          NOTA MIL
        </text>
        {/* check */}
        <path
          d="M40 70l6 6 14-14"
          fill="none"
          stroke="#14213D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
