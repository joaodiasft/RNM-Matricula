import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { homeForRole, type Role } from "@/lib/roles";

/**
 * Atualiza a sessão Supabase (refresh de tokens) e aplica o guard de rotas:
 * - sem sessão em rota protegida  -> /login
 * - com sessão em /login ou "/"   -> home do papel
 * - papel sem acesso à área       -> home do papel
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  const isPublic =
    isLogin ||
    path === "/" ||
    path.startsWith("/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path === "/logo-rnm.png";

  // Não autenticado numa rota protegida -> login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Autenticado: descobre o papel e mantém cada um na sua área
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_role")
      .eq("id", user.id)
      .single();

    const role = (profile?.primary_role ?? "ALUNO") as Role;
    const home = homeForRole(role);

    if (isLogin || path === "/") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      url.search = "";
      return NextResponse.redirect(url);
    }

    const areaOf = (p: string) =>
      p.startsWith("/aluno")
        ? "ALUNO"
        : p.startsWith("/professor")
          ? "PROFESSOR"
          : p.startsWith("/admin")
            ? "ADMIN"
            : null;
    const area = areaOf(path);
    const allowed =
      area === null ||
      (area === "ALUNO" && (role === "ALUNO" || role === "RESPONSAVEL")) ||
      (area === "PROFESSOR" && role === "PROFESSOR") ||
      (area === "ADMIN" && role === "ADMIN");

    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
