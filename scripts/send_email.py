#!/usr/bin/env python3
"""
Envio de e-mails via Resend (Redação Nota Mil).

Uso:
  python scripts/send_email.py --to destino@email.com --subject "Assunto" --html "<p>Olá</p>"
  python scripts/send_email.py --otp destino@email.com --code 1234
  python scripts/send_email.py --test  # envia e-mail de teste para COMPANY_EMAIL

Variáveis (.env.local ou ambiente):
  RESEND_API_KEY
  RESEND_FROM   (opcional)
  COMPANY_EMAIL (opcional)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FROM = "Redação Nota Mil <onboarding@resend.dev>"
COMPANY_EMAIL = "naredacaonota1000@gmail.com"
API_URL = "https://api.resend.com/emails"


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def get_api_key() -> str:
    key = os.environ.get("RESEND_API_KEY", "").strip()
    if not key:
        print("ERRO: RESEND_API_KEY não configurada.", file=sys.stderr)
        sys.exit(1)
    return key


def send_email(*, to: str | list[str], subject: str, html: str) -> dict:
    api_key = get_api_key()
    from_addr = os.environ.get("RESEND_FROM") or DEFAULT_FROM
    recipients = to if isinstance(to, list) else [to]

    payload = {
        "from": from_addr,
        "to": recipients,
        "subject": subject,
        "html": html,
    }

    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "RNM-Matricula/1.0 (python-resend)",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            data = json.loads(body) if body else {}
            print(f"OK: e-mail enviado para {', '.join(recipients)} (id={data.get('id')})")
            return data
    except urllib.error.HTTPError as exc:
        err = exc.read().decode("utf-8", errors="replace")
        print(f"FALHA HTTP {exc.code}: {err}", file=sys.stderr)
        if "verify a domain" in err:
            print(
                "\nDica: no plano de teste do Resend só é possível enviar para o e-mail da conta.\n"
                "Verifique um domínio em https://resend.com/domains e use RESEND_FROM com esse domínio.",
                file=sys.stderr,
            )
        sys.exit(1)


def otp_html(code: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt-BR"><body style="font-family:Georgia,serif;color:#1a2e24;">
  <div style="max-width:520px;margin:24px auto;padding:24px;border-radius:12px;background:#fff;border:1px solid #d8efe4;">
    <p style="color:#0d5c45;font-size:13px;letter-spacing:.12em;text-transform:uppercase;">Redação Nota Mil</p>
    <h1 style="font-size:22px;">Código de verificação</h1>
    <p>Olá! Seu código para confirmar a matrícula é:</p>
    <p style="font-size:32px;letter-spacing:.25em;font-weight:700;text-align:center;margin:24px 0;">{code}</p>
    <p>Ele expira em alguns minutos. Se você não pediu esse código, ignore este e-mail.</p>
  </div>
</body></html>"""


def test_html() -> str:
    return """<!DOCTYPE html>
<html lang="pt-BR"><body style="font-family:Georgia,serif;">
  <div style="max-width:520px;margin:24px auto;padding:24px;">
    <h1>Teste Resend — Redação Nota Mil</h1>
    <p>Se você recebeu este e-mail, a integração Resend está funcionando.</p>
  </div>
</body></html>"""


def main() -> None:
    load_dotenv(ROOT / ".env.local")
    load_dotenv(ROOT / ".env")

    parser = argparse.ArgumentParser(description="Enviar e-mail via Resend")
    parser.add_argument("--to", help="Destinatário")
    parser.add_argument("--subject", help="Assunto")
    parser.add_argument("--html", help="Corpo HTML")
    parser.add_argument("--otp", metavar="EMAIL", help="Envia OTP para o e-mail")
    parser.add_argument("--code", default="1234", help="Código OTP (com --otp)")
    parser.add_argument("--test", action="store_true", help="E-mail de teste")
    args = parser.parse_args()

    company = os.environ.get("COMPANY_EMAIL") or COMPANY_EMAIL

    if args.test:
        send_email(
            to=company,
            subject="✅ Teste Resend — Redação Nota Mil",
            html=test_html(),
        )
        return

    if args.otp:
        send_email(
            to=args.otp,
            subject="Seu código de verificação — Redação Nota Mil",
            html=otp_html(args.code),
        )
        return

    if not args.to or not args.subject or not args.html:
        parser.error("Informe --to --subject --html, ou --otp, ou --test")

    send_email(to=args.to, subject=args.subject, html=args.html)


if __name__ == "__main__":
    main()
