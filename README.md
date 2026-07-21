# Sistema de Matrícula Online — Redação Nota Mil

Wizard mobile-first de matrícula (9 passos + WhatsApp), autosave, e-mails (confirmação e abandono), exportação Excel, painel admin e anti-bot Turnstile.

## Stack

- **Next.js 15** (App Router) + Tailwind CSS 4 + Framer Motion
- **Neon Postgres** + Drizzle ORM
- **Resend** (e-mails)
- **Cloudflare** (OpenNext Workers/Pages, Turnstile, Cron HTTP)
- **ExcelJS** (relatórios)

## Início rápido (local)

1. Copie o ambiente:

```bash
cp .env.example .env.local
```

2. Preencha pelo menos `DATABASE_URL` e `SESSION_SECRET`.

3. Instale e suba o schema:

```bash
npm install
npm run db:push
npm run db:seed
```

4. Rode o app:

```bash
npm run dev
```

- Matrícula pública: [http://localhost:3000/matricula](http://localhost:3000/matricula)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
  (usuário/senha = `ADMIN_EMAIL` / `ADMIN_PASSWORD` do `.env`)

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Connection string Neon |
| `SESSION_SECRET` | Cookie JWT do admin (≥16 chars) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed do usuário secretaria |
| `RESEND_API_KEY` / `RESEND_FROM` | E-mails transacionais |
| `COMPANY_EMAIL` | Destino dos avisos da empresa |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Anti-bot (vazio = desligado em dev) |
| `CRON_SECRET` | Bearer token dos crons |
| `DEFAULT_CARD_FEE_PERCENT` | Taxa padrão da maquininha |

## Crons

Chame com header `Authorization: Bearer $CRON_SECRET`:

- Abandono (a cada ~15 min): `GET /api/cron/abandonment`
- Excel do dia (~23:59 SP): `GET /api/cron/daily-excel`

No Cloudflare, use **Cron Triggers** apontando para essas URLs (via Worker externo ou scheduled fetch) ou um scheduler (GitHub Actions).

## Deploy Cloudflare

```bash
npm run deploy
```

Configure secrets no Wrangler/Dashboard: `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `TURNSTILE_SECRET_KEY`, etc.

## Fluxo público (resumo)

1. Dados do aluno (+ LGPD) · 2. Responsáveis (se &lt;18) · 3. Turmas · 4. Infos do curso · 5. Modalidade · 6. Plano · 7. Pagamento · 8. Rematrícula · 9. Avisos · 10. Revisão + declaração digital · WhatsApp com mensagem pronta.

Autosave: localStorage + servidor (`session_token`), a cada ~800ms.

## Empresa

Redação Nota Mil · CNPJ 51.241.242/0001-08 · (62) 98189-9570 · naredacaonota1000@gmail.com
