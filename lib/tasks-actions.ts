"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getTasksAction(status?: string) {
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

    // Determine status filter
    let statusFilter: any = undefined;
    if (status && status !== "todas") {
      statusFilter = status.toUpperCase();
    }

    // Fetch tasks
    const tarefas = await prisma.tarefa.findMany({
      where: {
        utilizadorId: user.id,
        ...(statusFilter && { status: statusFilter }),
      },
      include: {
        disciplina: true,
      },
      orderBy: [
        { prazo: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Group by priority
    const porPrioridade = {
      ALTA: tarefas.filter((t) => t.prioridade === "ALTA"),
      MEDIA: tarefas.filter((t) => t.prioridade === "MEDIA"),
      BAIXA: tarefas.filter((t) => t.prioridade === "BAIXA"),
    };

    return {
      success: true,
      data: {
        tarefas,
        porPrioridade,
        total: tarefas.length,
        pendentes: tarefas.filter((t) => t.status === "PENDENTE").length,
        completas: tarefas.filter((t) => t.status === "CONCLUIDA").length,
      },
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return {
      success: false,
      error: "Erro ao carregar tarefas",
      data: null,
    };
  }
}

export async function updateTaskStatusAction(tarefaId: string, status: string) {
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

    // Verify ownership
    const tarefa = await prisma.tarefa.findUnique({
      where: { id: tarefaId },
    });

    if (!tarefa || tarefa.utilizadorId !== user.id) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    // Update status
    await prisma.tarefa.update({
      where: { id: tarefaId },
      data: {
        status: status.toUpperCase(),
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating task status:", error);
    return { success: false, error: "Erro ao atualizar tarefa" };
  }
}

export async function deleteTaskAction(tarefaId: string) {
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

    // Verify ownership
    const tarefa = await prisma.tarefa.findUnique({
      where: { id: tarefaId },
    });

    if (!tarefa || tarefa.utilizadorId !== user.id) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    // Delete task
    await prisma.tarefa.delete({
      where: { id: tarefaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: "Erro ao eliminar tarefa" };
  }
}
