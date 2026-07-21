"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPANY } from "@/lib/company";

const LINKS = [
  { href: "/admin/dashboard", label: "Matrículas" },
  { href: "/admin/turmas", label: "Turmas" },
  { href: "/admin/operacoes", label: "Operações" },
  { href: "/admin/settings", label: "Config" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/admin/dashboard" className="font-display text-lg font-bold text-ink">
          {COMPANY.name}
          <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 font-sans text-[10px] font-extrabold uppercase tracking-wider text-brand">
            Admin
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/admin/dashboard" &&
                pathname.startsWith(link.href)) ||
              (link.href === "/admin/dashboard" &&
                (pathname.startsWith("/admin/dashboard") ||
                  pathname.startsWith("/admin/matriculas")));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 font-semibold transition ${
                  active
                    ? "bg-brand text-white shadow-[var(--shadow-brand)]"
                    : "text-muted hover:bg-bg-subtle hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            className="rounded-xl px-3 py-2 font-semibold text-muted transition hover:bg-danger-soft hover:text-danger"
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
