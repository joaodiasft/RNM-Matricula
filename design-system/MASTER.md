# Design System — Redação Nota Mil (Matrícula) · v3

Universo da redação: **tinta, papel e o selo de nota máxima**. Nada de
azul-roxo de SaaS genérico — paleta exclusiva: azul-tinta + dourado marca-texto.

## Cores (tokens)

| Token | Hex | Uso |
|---|---|---|
| `tinta-900` (`--ink` / `--brand`) | `#14213D` | Texto, cabeçalhos, ícones, progresso ("linha de caderno"), foco, seleção |
| `papel-50` (`--paper` / `--bg`) | `#F7F8FA` | Fundo geral das telas — branco "de papel" |
| `grifa-500` (`--gold`) | `#F2B705` | **CTA principal** (texto em tinta), Selo Nota Mil, valores/códigos em destaque |
| `sucesso-600` / maior (`--maior`/`--success`) | `#16A34A` | Badge "maior de idade" 🟩, vaga disponível, sucesso |
| `menor-500` (`--menor`) | `#EC4899` | Badge "menor de idade" 🌸 |
| `alerta-500` (`--alert`) | `#F59E0B` | Últimas vagas, avisos |
| `erro-600` (`--danger`) | `#DC2626` | Turma lotada, erro de validação |
| `info-500` (`--info`) | `#6366F1` | Lista de espera, neutros |
| `tinta-100` (`--line`) | `#E4E7EC` | Bordas, divisores |
| hero | `#0B1226 → #14213D` + brilho dourado | Faixa escura do logo (PNG com fundo preto) e telas de confirmação |

A cor da idade (rosa/verde) é **sempre a mesma** onde a idade aparece —
formulário, resumo, e-mail e Excel. Ver `components/matricula/AgeBadge.tsx`.

**Regra do hero escuro:** sobre a `.hero-gradient` (fundo escuro) os acentos são
**dourados** (`text-gold`), nunca `text-brand` (azul-tinta some no escuro).

## Tipografia

- Display (títulos, número do passo, valores grandes): **Fraunces** (serifada, 600–900)
- Corpo (formulário, textos): **Inter**
- Dados (códigos de indicação, R$, timestamps): **IBM Plex Mono** — classe `.data`, ar "carimbado"

As variáveis do next/font ficam no `<html>`; os aliases `--font-display/body/mono`
são definidos no `body {}` (não no `:root`) para resolverem corretamente.

## Selo Nota Mil

Carimbo circular dourado com "1000" + check (`components/matricula/SeloNotaMil.tsx`).
Usado com moderação: conclusão de matrícula (tela final) e card-resumo do WhatsApp.
Microanimação `animate-selo` (respeita `prefers-reduced-motion`).

## CTA e botões

- CTA principal (avançar/confirmar): `.cta-gold` — gradiente dourado, **texto em tinta**, sombra `--shadow-gold`.
- Progresso e chips estruturais: `.brand-gradient` — azul-tinta, texto branco.

## UX (obrigatório)

- Touch targets ≥ 48px · foco visível (tinta)
- `prefers-reduced-motion` respeitado
- Erros com `role="alert"` perto do campo
- Um CTA primário por tela (dourado)
- Tema: **claro fixo** (`color-scheme: light`) — o logo (fundo preto) vive na faixa escura
