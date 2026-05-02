"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getNotificacoesAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado", data: null };
    }

    const user = await prisma.utilizador.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "Utilizador não encontrado", data: null };
    }

    const notificacoes = await prisma.notificacaoApp.findMany({
      where: { utilizadorId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = notificacoes.filter((item) => !item.lida).length;

    return {
      success: true,
      data: {
        notificacoes,
        unreadCount,
      },
    };
  } catch (error) {
    console.error("Error fetching notificacoes:", error);
    return {
      success: false,
      error: "Erro ao carregar notificações",
      data: null,
    };
  }
}

export async function markNotificacaoLidaAction(notificacaoId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado" };
    }

    const user = await prisma.utilizador.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "Utilizador não encontrado" };
    }

    const notificacao = await prisma.notificacaoApp.findUnique({
      where: { id: notificacaoId },
    });

    if (!notificacao || notificacao.utilizadorId !== user.id) {
      return { success: false, error: "Notificação não encontrada" };
    }

    const updated = await prisma.notificacaoApp.update({
      where: { id: notificacaoId },
      data: { lida: true },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Erro ao atualizar notificação" };
  }
}

export async function markAllNotificacoesLidasAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado" };
    }

    const user = await prisma.utilizador.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "Utilizador não encontrado" };
    }

    await prisma.notificacaoApp.updateMany({
      where: { utilizadorId: user.id, lida: false },
      data: { lida: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Erro ao atualizar notificações" };
  }
}
