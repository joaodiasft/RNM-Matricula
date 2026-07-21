"use client";

import { useEffect } from "react";

/**
 * Dissuasores no cliente (F12, menu de contexto, "ver código-fonte") + aviso
 * anti self-XSS no console.
 *
 * ATENÇÃO: isto é apenas um DISSUASOR cosmético, não segurança. Qualquer pessoa
 * contorna em segundos (basta abrir o DevTools por outro caminho ou desabilitar
 * o JS). A segurança real do sistema está no SERVIDOR — validação, rate-limit,
 * autenticação e CSP —, que não confiam no navegador. Mantido leve de propósito:
 * nada de loops de `debugger` que travam a aba e prejudicam usuários legítimos.
 */
export function ClientGuards() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const isDevtools =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (k === "i" || k === "j" || k === "c")) ||
        (e.metaKey && e.altKey && (k === "i" || k === "j" || k === "c")) ||
        (e.ctrlKey && k === "u");
      if (isDevtools) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("contextmenu", onContextMenu);

    // Aviso anti golpe (tática usada por grandes sites contra "self-XSS").
    try {
      console.log(
        "%cAtenção!",
        "color:#e91e8c;font-size:34px;font-weight:800;font-family:sans-serif;"
      );
      console.log(
        "%cEsta é uma área para desenvolvedores. Não digite nem cole nada aqui. Golpistas podem usar isto para roubar seus dados e sua matrícula.",
        "font-size:14px;color:#333;"
      );
    } catch {
      /* console indisponível */
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  return null;
}
