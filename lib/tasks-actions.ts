"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { PrioridadeTarefa, StatusTarefa } from "@prisma/client";

const statusValues = Object.values(StatusTarefa);
const prioridadeValues = Object.values(PrioridadeTarefa);

type TaskInput = {
  titulo: string;
  descricao?: string | null;
  prazo?: string | Date | null;
  prioridade?: PrioridadeTarefa;
  status?: StatusTarefa;
  disciplinaId?: string | null;
  progresso?: number;
};

function parseOptionalDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampProgress(value: number | undefined, fallback = 0) {
  return Math.min(100, Math.max(0, value ?? fallback));
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return { user: null, error: "Não autenticado" };
  }

  const user = await prisma.utilizador.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return { user: null, error: "Utilizador não encontrado" };
  }

  return { user, error: null };
}

async function assertDisciplinaOwner(
  disciplinaId: string | null | undefined,
  utilizadorId: string,
) {
  if (!disciplinaId) return true;

  const disciplina = await prisma.disciplina.findUnique({
    where: { id: disciplinaId },
    select: { utilizadorId: true },
  });

  return disciplina?.utilizadorId === utilizadorId;
}

function normalizeStatus(status?: StatusTarefa) {
  return status && statusValues.includes(status) ? status : StatusTarefa.PENDENTE;
}

function normalizePrioridade(prioridade?: PrioridadeTarefa) {
  return prioridade && prioridadeValues.includes(prioridade)
    ? prioridade
    : PrioridadeTarefa.MEDIA;
}

export async function getTasksAction(status?: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    let statusFilter: StatusTarefa | undefined;
    if (status && status !== "todas") {
      const candidate = status.toUpperCase() as StatusTarefa;
      statusFilter = statusValues.includes(candidate) ? candidate : undefined;
    }

    const [tarefas, disciplinas] = await Promise.all([
      prisma.tarefa.findMany({
        where: {
          utilizadorId: user.id,
          ...(statusFilter && { status: statusFilter }),
        },
        include: {
          disciplina: {
            select: {
              id: true,
              nome: true,
              cor: true,
            },
          },
        },
        orderBy: [{ prazo: "asc" }, { createdAt: "desc" }],
      }),
      prisma.disciplina.findMany({
        where: { utilizadorId: user.id, ativo: true },
        select: {
          id: true,
          nome: true,
          cor: true,
        },
        orderBy: { nome: "asc" },
      }),
    ]);

    const porPrioridade = {
      ALTA: tarefas.filter((t) => t.prioridade === "ALTA"),
      MEDIA: tarefas.filter((t) => t.prioridade === "MEDIA"),
      BAIXA: tarefas.filter((t) => t.prioridade === "BAIXA"),
    };

    return {
      success: true,
      data: {
        tarefas,
        disciplinas,
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

export async function createTaskAction(input: TaskInput) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const titulo = input.titulo.trim();
    if (!titulo) {
      return { success: false, error: "Título obrigatório", data: null };
    }

    if (!(await assertDisciplinaOwner(input.disciplinaId, user.id))) {
      return { success: false, error: "Disciplina inválida", data: null };
    }

    const status = normalizeStatus(input.status);
    const tarefa = await prisma.tarefa.create({
      data: {
        utilizadorId: user.id,
        titulo,
        descricao: input.descricao?.trim() || null,
        prazo: parseOptionalDate(input.prazo),
        prioridade: normalizePrioridade(input.prioridade),
        status,
        disciplinaId: input.disciplinaId || null,
        progresso: clampProgress(input.progresso),
        concluidaEm: status === StatusTarefa.CONCLUIDA ? new Date() : null,
      },
      include: {
        disciplina: {
          select: {
            id: true,
            nome: true,
            cor: true,
          },
        },
      },
    });

    return { success: true, data: tarefa };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, error: "Erro ao criar tarefa", data: null };
  }
}

export async function updateTaskAction(input: TaskInput & { tarefaId: string }) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const tarefa = await prisma.tarefa.findUnique({
      where: { id: input.tarefaId },
    });

    if (!tarefa || tarefa.utilizadorId !== user.id) {
      return { success: false, error: "Tarefa não encontrada", data: null };
    }

    const titulo = input.titulo.trim();
    if (!titulo) {
      return { success: false, error: "Título obrigatório", data: null };
    }

    if (!(await assertDisciplinaOwner(input.disciplinaId, user.id))) {
      return { success: false, error: "Disciplina inválida", data: null };
    }

    const status = input.status && statusValues.includes(input.status)
      ? input.status
      : tarefa.status;

    const updated = await prisma.tarefa.update({
      where: { id: input.tarefaId },
      data: {
        titulo,
        descricao: input.descricao?.trim() || null,
        prazo: parseOptionalDate(input.prazo),
        prioridade:
          input.prioridade && prioridadeValues.includes(input.prioridade)
            ? input.prioridade
            : tarefa.prioridade,
        status,
        disciplinaId: input.disciplinaId || null,
        progresso: status === StatusTarefa.CONCLUIDA
          ? 100
          : clampProgress(input.progresso, tarefa.progresso),
        concluidaEm:
          status === StatusTarefa.CONCLUIDA ? tarefa.concluidaEm ?? new Date() : null,
      },
      include: {
        disciplina: {
          select: {
            id: true,
            nome: true,
            cor: true,
          },
        },
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, error: "Erro ao atualizar tarefa", data: null };
  }
}

export async function updateTaskStatusAction(tarefaId: string, status: StatusTarefa) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error };
    }

    const tarefa = await prisma.tarefa.findUnique({
      where: { id: tarefaId },
    });

    if (!tarefa || tarefa.utilizadorId !== user.id) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    const nextStatus = statusValues.includes(status) ? status : StatusTarefa.PENDENTE;

    await prisma.tarefa.update({
      where: { id: tarefaId },
      data: {
        status: nextStatus,
        progresso: nextStatus === StatusTarefa.CONCLUIDA ? 100 : tarefa.progresso,
        concluidaEm: nextStatus === StatusTarefa.CONCLUIDA ? new Date() : null,
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
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error };
    }

    const tarefa = await prisma.tarefa.findUnique({
      where: { id: tarefaId },
    });

    if (!tarefa || tarefa.utilizadorId !== user.id) {
      return { success: false, error: "Tarefa não encontrada" };
    }

    await prisma.tarefa.delete({
      where: { id: tarefaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: "Erro ao eliminar tarefa" };
  }
}
