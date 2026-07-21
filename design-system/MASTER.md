# Design System — Redação Nota Mil (Matrícula)

Fonte: logo oficial + guidelines ui-ux-pro-max

## Cores (tokens)

| Token | Hex | Uso |
|---|---|---|
| brand | `#E91E8C` | CTA, progresso, destaques |
| brand-deep | `#B01268` | hover CTA |
| brand-soft | `#FCE4F1` | fundos suaves |
| ink / fg | `#1F1F21` | texto principal (light) |
| muted | `#6B6B6F` | texto secundário |
| bg | `#F7F7F9` | fundo página |
| bg-elevated | `#FFFFFF` | cards/forms |
| hero | `#0A0A0A` | faixa da marca / confirmação |

Dark mode: fundo `#0A0A0A`, brand `#FF4DB0`, surfaces `#16161A`.

## Tipografia

- Display: **Montserrat** 600–800
- Body: **Plus Jakarta Sans** 400–700
- Base 16px, line-height ~1.55

## UX (obrigatório)

- Touch targets ≥ 48px
- Focus ring visível (brand)
- `prefers-reduced-motion` respeitado
- Erros com `role="alert"` perto do campo
- Ícones SVG (não emoji estrutural)
- Um CTA primário por tela (magenta)

## Anti-padrões evitados

- Mistura de estilos flat/skeuomorphic
- Placeholder como único label
- Hover-only em mobile
- Contraste insuficiente no dark mode
