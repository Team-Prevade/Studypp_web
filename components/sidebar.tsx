"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookMarked,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronDown,
  FileText,
  Home,
  LogOut,
  Menu,
  SlidersHorizontal,
  Sparkles,
  Target,
  Timer,
  User,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";
import { Logo } from "@/components/shared/logo";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/assistente", label: "Assistente", icon: Sparkles },
  { href: "/horario", label: "Horario", icon: Calendar },
  { href: "/calendario", label: "Calendario", icon: Calendar },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
  { href: "/notas", label: "Notas", icon: FileText },
  { href: "/disciplinas", label: "Disciplinas", icon: BookOpen },
  { href: "/apontamentos", label: "Apontamentos", icon: BookMarked },
  { href: "/objectivos", label: "Objectivos", icon: Target },
  { href: "/temporizador", label: "Temporizador", icon: Timer },
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
    if (href !== pathname) setPendingHref(href);
  };

  const accountMenu = (
    <div className="absolute bottom-full left-4 right-4 z-20 mb-2 rounded-xl border border-white/10 bg-[#12133a] p-1 shadow-2xl">
      <Link
        href="/perfil"
        onMouseEnter={() => router.prefetch("/perfil")}
        onFocus={() => router.prefetch("/perfil")}
        onClick={() => handleNavigate("/perfil")}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
      >
        <User className="h-4 w-4" />
        <span>Perfil</span>
      </Link>
      <Link
        href="/definicoes"
        onMouseEnter={() => router.prefetch("/definicoes")}
        onFocus={() => router.prefetch("/definicoes")}
        onClick={() => handleNavigate("/definicoes")}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Definicoes</span>
      </Link>
      <button
        type="button"
        onClick={() => logoutAction()}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
      >
        <LogOut className="h-4 w-4" />
        <span>Terminar sessao</span>
      </button>
    </div>
  );

  return (
    <>
      <header className="brand-sidebar sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 px-4 text-white shadow-sm lg:hidden">
        <Logo size="sm" withText={false} dark={true} />
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="brand-glass rounded-xl p-2 text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Abrir navegacao"
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
          aria-label="Fechar navegacao"
        />
      ) : null}

      <aside
        className={`brand-sidebar fixed left-0 top-0 z-50 flex h-screen w-72 max-w-[86vw] flex-col text-white shadow-2xl transition-transform duration-200 lg:z-30 lg:w-56 lg:translate-x-0 lg:shadow-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <Logo size="md" withText={false} dark={true} />
            <button
              type="button"
              onClick={closeMenus}
              className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 lg:hidden"
              aria-label="Fechar navegacao"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

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
                    ? "bg-white/15 font-semibold text-white"
                    : isActive
                      ? "bg-white font-semibold text-[#17134a] shadow-[0_12px_28px_rgba(0,0,0,0.14)]"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {pendingHref === item.href ? (
                  <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-white/80" />
                ) : null}
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 p-4">
          {isAccountMenuOpen ? accountMenu : null}
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            className="brand-glass flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-white/90 transition-colors hover:bg-white/15"
            aria-label="Abrir menu da conta"
            aria-expanded={isAccountMenuOpen}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-[0_10px_24px_rgba(36,107,255,0.18)]">
                <User className="h-4 w-4 text-white" />
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-semibold text-white">Conta</span>
                <span className="block truncate text-xs text-white/55">Perfil e definicoes</span>
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-white/60 transition-transform ${
                isAccountMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
