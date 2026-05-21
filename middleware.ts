import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "studypp_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/horario") ||
    pathname.startsWith("/calendario") ||
    pathname.startsWith("/tarefas") ||
    pathname.startsWith("/notas") ||
    pathname.startsWith("/disciplinas") ||
    pathname.startsWith("/apontamentos") ||
    pathname.startsWith("/objectivos") ||
    pathname.startsWith("/temporizador") ||
    pathname.startsWith("/lembretes") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/definicoes") ||
    pathname.startsWith("/estatisticas") ||
    pathname.startsWith("/notificacoes") ||
    pathname.startsWith("/onboarding");

  if (isProtectedPage && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|favicon.svg).*)"],
};
