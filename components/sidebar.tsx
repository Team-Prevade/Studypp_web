"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut,
  BookOpen as BookIcon,
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
  { href: "/perfil", label: "Perfil", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gradient-to-b from-teal-700 via-teal-600 to-teal-700 text-white overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-teal-600">
        <div className="flex items-center gap-3 mb-2">
          <BookIcon className="w-6 h-6" />
          <h1 className="text-xl font-bold">Study++</h1>
        </div>
        <p className="text-sm text-teal-100">O teu assistente digital</p>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-white text-teal-700 font-semibold"
                  : "text-teal-100 hover:bg-teal-600/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={() => logoutAction()}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
