"use client";

import Link from "next/link";
import { COMPANY } from "@/lib/company";

export function AdminNav() {
  return (
    <header className="border-b border-line/60 bg-bg-elevated/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/admin/dashboard" className="font-display text-lg text-fg">
          {COMPANY.name}
          <span className="ml-2 font-sans text-xs font-semibold uppercase tracking-wider text-brand">
            Admin
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin/dashboard" className="text-muted hover:text-fg">
            Matrículas
          </Link>
          <Link href="/admin/settings" className="text-muted hover:text-fg">
            Config
          </Link>
          <button
            type="button"
            className="text-muted hover:text-fg"
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              window.location.href = "/admin/login";
            }}
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
