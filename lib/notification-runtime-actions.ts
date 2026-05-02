"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

type RuntimeNotification = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  url: string | null;
  createdAt: Date;
};

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return { user: null, error: "Não autenticado" };
  }

  const user = await prisma.utilizador.findUnique({
    where: { email: session.user.email },
    include: { preferenciasNotif: true },
  });

  if (!user) {
    return { user: null, error: "Utilizador não encontrado" };
  }

  return { user, error: null };
}

async function createNotificationOnce(input: {
  utilizadorId: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  url: string;
}) {
  const existing = await prisma.notificacaoApp.findFirst({
    where: {
      utilizadorId: input.utilizadorId,
      titulo: input.titulo,
      tipo: input.tipo,
      url: input.url,
    },
    select: { id: true },
  });

  if (existing) return null;

  return prisma.notificacaoApp.create({ data: input });
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function getNotificationRuntimeAction() {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const prefs = user.preferenciasNotif;
    const now = new Date();
    const taskLead = prefs?.notifTarefasAntecedencia ?? 1440;
    const taskLimit = new Date(now.getTime() + taskLead * 60 * 1000);

    const jobs: Array<Promise<unknown>> = [];

    if (prefs?.notifLembretesAtivo ?? true) {
      const dueReminders = await prisma.lembrete.findMany({
        where: {
          utilizadorId: user.id,
          concluido: false,
          dataHora: { lte: now },
        },
        take: 12,
        orderBy: { dataHora: "asc" },
      });

      for (const reminder of dueReminders) {
        jobs.push(
          createNotificationOnce({
            utilizadorId: user.id,
            tipo: "LEMBRETE",
            titulo: `Lembrete: ${reminder.titulo}`,
            mensagem: `Agendado para ${formatDateTime(reminder.dataHora)}.`,
            url: "/lembretes",
          }),
        );
      }
    }

    if (prefs?.notifTarefasAtivo ?? true) {
      const dueTasks = await prisma.tarefa.findMany({
        where: {
          utilizadorId: user.id,
          status: { in: ["PENDENTE", "ATRASADA"] },
          prazo: { not: null, lte: taskLimit },
        },
        take: 12,
        orderBy: { prazo: "asc" },
      });

      for (const task of dueTasks) {
        const overdue = task.prazo ? task.prazo < now : false;
        if (overdue && !(prefs?.notifTarefasAtrasadas ?? true)) continue;

        jobs.push(
          createNotificationOnce({
            utilizadorId: user.id,
            tipo: "TAREFA",
            titulo: overdue ? `Tarefa atrasada: ${task.titulo}` : `Prazo próximo: ${task.titulo}`,
            mensagem: task.prazo
              ? `Prazo: ${formatDateTime(task.prazo)}.`
              : "Esta tarefa precisa da tua atenção.",
            url: "/tarefas",
          }),
        );
      }
    }

    if (jobs.length > 0) {
      await Promise.all(jobs);
    }

    const unread = await prisma.notificacaoApp.findMany({
      where: { utilizadorId: user.id, lida: false },
      select: {
        id: true,
        titulo: true,
        mensagem: true,
        tipo: true,
        url: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    return {
      success: true,
      data: {
        browserNotif: prefs?.browserNotif ?? false,
        unreadCount: unread.length,
        notifications: unread as RuntimeNotification[],
      },
    };
  } catch (error) {
    console.error("Error syncing runtime notifications:", error);
    return { success: false, error: "Erro ao sincronizar notificações", data: null };
  }
}
