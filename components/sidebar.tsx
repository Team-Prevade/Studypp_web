"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  CheckSquare,
  FileText,
  BookOpen,
  BookMarked,
  Target,
  Timer,
  BarChart3,
  Bell,
  User,
  SlidersHorizontal,
  LogOut,
  BookOpen as BookIcon,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/horario", label: "Horário", icon: Calendar },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
  { href: "/notas", label: "Notas", icon: FileText },
  { href: "/disciplinas", label: "Disciplinas", icon: BookOpen },
  { href: "/apontamentos", label: "Apontamentos", icon: BookMarked },
  { href: "/objectivos", label: "Objectivos", icon: Target },
  { href: "/temporizador", label: "Temporizador", icon: Timer },
  { href: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { href: "/lembretes", label: "Lembretes", icon: Bell },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const prefetch = () => {
      [...menuItems.map((item) => item.href), "/perfil", "/definicoes"].forEach((href) => {
        router.prefetch(href);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetch, 700);
    return () => globalThis.clearTimeout(timeoutId);
  }, [router]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const closeMenus = () => {
    setIsAccountMenuOpen(false);
    setIsMobileOpen(false);
  };

  const handleNavigate = (href: string) => {
    closeMenus();
    if (href !== pathname) {
      setPendingHref(href);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-blue-800 bg-blue-900 px-4 text-white shadow-sm lg:hidden">
        <div className="flex items-center gap-3">
          <BookIcon className="h-6 w-6" />
          <div>
            <h1 className="text-lg font-bold leading-none">Study++</h1>
            <p className="mt-1 text-xs text-blue-100">O teu assistente digital</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="rounded-lg border border-blue-700 bg-blue-800 p-2 text-blue-50 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          aria-label="Abrir navegação"
          aria-expanded={isMobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {isMobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={closeMenus}
          aria-label="Fechar navegação"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 max-w-[86vw] flex-col bg-linear-to-b from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl transition-transform duration-200 lg:z-30 lg:w-56 lg:translate-x-0 lg:shadow-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* Header */}
      <div className="border-b border-blue-700 p-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookIcon className="w-6 h-6" />
            <h1 className="text-xl font-bold">Study++</h1>
          </div>

          <button
            type="button"
            onClick={closeMenus}
            className="rounded-lg p-2 text-blue-100 transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 lg:hidden"
            aria-label="Fechar navegação"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 rounded-full border border-blue-600 bg-blue-800/80 px-2 py-1 text-blue-100 transition-colors hover:bg-blue-700/80"
              aria-label="Abrir menu da conta"
              aria-expanded={isAccountMenuOpen}
            >
              <User className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-blue-600 bg-blue-950 p-1 shadow-lg">
                <Link
                  href="/perfil"
                  onMouseEnter={() => router.prefetch("/perfil")}
                  onFocus={() => router.prefetch("/perfil")}
                  onClick={() => handleNavigate("/perfil")}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-blue-100 transition-colors hover:bg-blue-800"
                >
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </Link>
                <Link
                  href="/definicoes"
                  onMouseEnter={() => router.prefetch("/definicoes")}
                  onFocus={() => router.prefetch("/definicoes")}
                  onClick={() => handleNavigate("/definicoes")}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-blue-100 transition-colors hover:bg-blue-800"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Definições</span>
                </Link>
                <button
                  type="button"
                  onClick={() => logoutAction()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Terminar sessão</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-blue-100">O teu assistente digital</p>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar-blue flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const isCalendarioAtivo =
            item.href === "/calendario" &&
            (pathname === "/calendario" || pathname.startsWith("/calendario/"));
          const isActive = pathname === item.href || isCalendarioAtivo;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => router.prefetch(item.href)}
              onFocus={() => router.prefetch(item.href)}
              onClick={() => handleNavigate(item.href)}
              aria-busy={pendingHref === item.href}
              className={`relative flex items-center gap-3 overflow-hidden rounded-lg px-4 py-3 transition-colors ${
                pendingHref === item.href
                  ? "bg-white/15 text-white font-semibold"
                  : isActive
                  ? "bg-white text-blue-900 font-semibold"
                  : "text-blue-100 hover:bg-blue-700/50"
              }`}
            >
              {pendingHref === item.href ? (
                <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-white/80" />
              ) : null}
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
    </>
  );
}
