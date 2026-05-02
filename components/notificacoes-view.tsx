"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  CheckCheck,
  Check,
  Clock3,
  Filter,
  CircleAlert,
  ListTodo,
  Target,
  Timer,
  FileText,
} from "lucide-react";
import {
  markAllNotificacoesLidasAction,
  markNotificacaoLidaAction,
} from "@/lib/notificacoes-actions";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  url?: string | null;
  createdAt: Date | string;
}

interface NotificacoesViewProps {
  notificacoes: Notificacao[];
  unreadCount: number;
}

const typeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; bg: string; text: string }
> = {
  TAREFA: {
    label: "Tarefa",
    icon: <ListTodo size={14} />,
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  LEMBRETE: {
    label: "Lembrete",
    icon: <Bell size={14} />,
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  OBJECTIVO: {
    label: "Objectivo",
    icon: <Target size={14} />,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  SESSAO: {
    label: "Sessão",
    icon: <Timer size={14} />,
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  SISTEMA: {
    label: "Sistema",
    icon: <CircleAlert size={14} />,
    bg: "bg-slate-50",
    text: "text-slate-700",
  },
};

export function NotificacoesView({
  notificacoes,
  unreadCount,
}: NotificacoesViewProps) {
  const [items, setItems] = useState(notificacoes);
  const [loading, setLoading] = useState(false);

  const handleMarkRead = async (id: string) => {
    setLoading(true);
    const result = await markNotificacaoLidaAction(id);
    setLoading(false);

    if (result.success) {
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, lida: true } : item,
        ),
      );
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    const result = await markAllNotificacoesLidasAction();
    setLoading(false);

    if (result.success) {
      setItems((current) => current.map((item) => ({ ...item, lida: true })));
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Bell className="text-teal-700" size={30} />
            <h1 className="text-4xl font-bold text-gray-900">Notificações</h1>
          </div>
          <p className="text-gray-600">
            Acompanha alertas de tarefas, lembretes, objectivos e sessões.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
            {unreadCount} por ler
          </div>
          <button
            onClick={handleMarkAllRead}
            disabled={loading || unreadCount === 0}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            Marcar todas como lidas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Caixa de entrada
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter size={16} />
                Tudo
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <CheckCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Sem notificações
              </h3>
              <p className="mt-2 text-gray-600">
                Quando houver novidades sobre tarefas, lembretes ou sessões,
                elas aparecerão aqui.
              </p>
            </div>
          ) : (
            items.map((notificacao) => {
              const config = typeConfig[notificacao.tipo] || typeConfig.SISTEMA;
              return (
                <div
                  key={notificacao.id}
                  className={`rounded-xl border bg-white p-5 transition-shadow duration-150 hover:shadow-sm ${
                    notificacao.lida
                      ? "border-gray-100 opacity-75"
                      : "border-teal-100 ring-1 ring-teal-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.bg} ${config.text}`}
                    >
                      {config.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${config.bg} ${config.text}`}
                            >
                              {config.icon}
                              {config.label}
                            </span>
                            {!notificacao.lida && (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                                Nova
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {notificacao.titulo}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-gray-600">
                            {notificacao.mensagem}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock3 size={14} />
                          {formatDate(notificacao.createdAt)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {notificacao.url && (
                          <Link
                            href={notificacao.url}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            Abrir contexto
                          </Link>
                        )}
                        {!notificacao.lida && (
                          <button
                            onClick={() => handleMarkRead(notificacao.id)}
                            className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
                          >
                            Marcar como lida
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Resumo</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">
                  {items.length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3">
                <span className="text-gray-700">Não lidas</span>
                <span className="font-semibold text-teal-700">
                  {unreadCount}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                <span className="text-gray-700">Lidas</span>
                <span className="font-semibold text-blue-700">
                  {items.length - unreadCount}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-lg font-bold text-gray-900">Atalhos</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/lembretes"
                className="block rounded-lg bg-gray-50 px-4 py-3 text-gray-700 transition hover:bg-gray-100"
              >
                Ver lembretes
              </Link>
              <Link
                href="/tarefas"
                className="block rounded-lg bg-gray-50 px-4 py-3 text-gray-700 transition hover:bg-gray-100"
              >
                Ver tarefas
              </Link>
              <Link
                href="/objectivos"
                className="block rounded-lg bg-gray-50 px-4 py-3 text-gray-700 transition hover:bg-gray-100"
              >
                Ver objectivos
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
