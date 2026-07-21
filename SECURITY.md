# Segurança — Matrícula Redação Nota Mil

Resumo das proteções do sistema. **Princípio central: nunca confiar no
navegador (front-end).** Toda regra de verdade é aplicada no servidor.

## Camadas implementadas

### Cabeçalhos de segurança (`middleware.ts`)

Aplicados a todas as respostas:

- **Content-Security-Policy** com _nonce_ por requisição + `strict-dynamic` —
  bloqueia XSS por injeção de `<script>`, mesmo que algum dado escape a
  sanitização. `frame-ancestors 'none'` + `X-Frame-Options: DENY` impedem
  clickjacking.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
  (câmera/mic/geo/pagamento desligados), `Cross-Origin-Opener/Resource-Policy`.
- `Strict-Transport-Security` (HSTS) em produção.
- `X-Powered-By` removido (menos fingerprint).
- Respostas de `/api/*` marcadas `no-store` (PII não fica em cache).

### Autenticação e sessão

- Senhas com **bcrypt** (custo 12). Sessão em **JWT httpOnly + Secure +
  SameSite=Lax**; `SESSION_SECRET` obrigatório (mín. 16 chars).
- **Rate limit no login** (8/min por IP + 10/5min por e-mail) contra
  força-bruta. Verificação de senha em **tempo constante** mesmo quando o
  e-mail não existe (evita enumeração de usuários).
- Rotas `/admin/*` e `/api/admin/*` exigem sessão válida no servidor.

### Fluxo de matrícula

- **Validação server-side** do rascunho (Zod): limites de tamanho, tipos e
  enums; **chaves desconhecidas são descartadas** (bloqueia mass-assignment,
  ex.: `isAdmin`, `__proto__`). Corpo acima de 32 KB → `413`.
- **OTP de e-mail**: 6 dígitos gerados por **CSPRNG** (`crypto`), TTL 10 min,
  com trava por IP **e por sessão** (adivinhar é inviável).
- Rate limit em criar/ler/salvar sessão e ao concluir a matrícula.
- E-mails montam HTML com **escape** de todos os dados do usuário (sem injeção
  de HTML na caixa da secretaria).
- Tokens de sessão/edição são opacos (`nanoid`, 32–40 chars).

### Crons

- `/api/cron/*` exigem `Authorization: Bearer $CRON_SECRET`.
  **Fail-closed em produção**: sem `CRON_SECRET`, negam o acesso.

## ⚠️ Configure em produção (senão a proteção não vale)

Defina como _secrets_ (nunca commitados — `.env.local` está no `.gitignore`):

| Variável | Por quê |
|---|---|
| `SESSION_SECRET` | Assina as sessões admin. Use string longa e aleatória (32+). |
| `CRON_SECRET` | Sem ele, os crons ficam bloqueados em produção. |
| `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Ativa o anti-robô no envio da matrícula. |
| `DATABASE_URL` | Conexão Neon com `sslmode=require`. |

## Sobre "bloquear o F12"

`components/ClientGuards.tsx` desabilita F12 / menu de contexto / "ver
código-fonte" e mostra um aviso anti-golpe no console. **Isso é apenas um
dissuasor cosmético, não segurança** — qualquer pessoa contorna em segundos.
Por isso a segurança real está toda no servidor (acima). O bloqueio roda só em
produção e foi mantido leve de propósito (sem loops de `debugger` que travam a
aba de usuários legítimos).
