"use client";

/**
 * Badge de idade — cor consistente em todo o sistema:
 * 🌸 rosa (menor-500) para menor de idade · 🟩 verde (maior/sucesso) para maior.
 * A mesma cor aparece no formulário, no resumo, no e-mail e no Excel.
 */
export function AgeBadge({
  age,
  size = "md",
}: {
  age: number;
  size?: "sm" | "md";
}) {
  const isMinor = age < 18;
  const sizing =
    size === "sm"
      ? "px-2.5 py-1 text-xs gap-1.5"
      : "px-3 py-1.5 text-sm gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${sizing}`}
      style={{
        background: isMinor ? "var(--menor-soft)" : "var(--maior-soft)",
        color: isMinor ? "#a5216b" : "#0f7a37",
      }}
    >
      <span aria-hidden>{isMinor ? "🌸" : "🟩"}</span>
      <span className="data">{age} anos</span>
      <span className="opacity-70">
        · {isMinor ? "Menor de idade" : "Maior de idade"}
      </span>
    </span>
  );
}
