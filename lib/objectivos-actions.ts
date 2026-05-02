"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getObjectivosAction() {
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

    // Fetch all goals with subtasks
    const objectivos = await prisma.objectivo.findMany({
      where: {
        utilizadorId: user.id,
      },
      include: {
        subTarefas: true,
      },
      orderBy: [{ status: "asc" }, { prazo: "asc" }],
    });

    // Calculate progress for each goal
    const objectivosComProgresso = objectivos.map((objetivo) => {
      const totalSubtarefas = objetivo.subTarefas.length;
      const concluidas = objetivo.subTarefas.filter(
        (st) => st.concluida,
      ).length;
      const progresso =
        totalSubtarefas > 0
          ? Math.round((concluidas / totalSubtarefas) * 100)
          : 0;

      return {
        ...objetivo,
        progresso,
        totalSubtarefas,
        concluidas,
      };
    });

    // Calculate on-track percentage
    const activeGoals = objectivosComProgresso.filter(
      (o) => o.status === "ACTIVO",
    );
    const onTrack = activeGoals.filter((o) => o.progresso >= 50).length;
    const onTrackPercentage =
      activeGoals.length > 0
        ? Math.round((onTrack / activeGoals.length) * 100)
        : 0;

    return {
      success: true,
      data: {
        objectivos: objectivosComProgresso,
        onTrackPercentage,
        activeCount: activeGoals.length,
        completedCount: objectivosComProgresso.filter(
          (o) => o.status === "CONCLUIDO",
        ).length,
      },
    };
  } catch (error) {
    console.error("Error fetching objectivos:", error);
    return {
      success: false,
      error: "Erro ao carregar objectivos",
      data: null,
    };
  }
}

export async function createObjectivoAction(
  titulo: string,
  descricao: string,
  categoria: string,
  prazo?: Date,
) {
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

    const objectivo = await prisma.objectivo.create({
      data: {
        utilizadorId: user.id,
        titulo,
        descricao,
        categoria: categoria as any,
        prazo,
      },
      include: {
        subTarefas: true,
      },
    });

    return { success: true, data: objectivo };
  } catch (error) {
    console.error("Error creating objectivo:", error);
    return { success: false, error: "Erro ao criar objectivo" };
  }
}

export async function updateObjectivoAction(
  objectivoId: string,
  titulo: string,
  descricao: string,
  categoria: string,
  prazo?: Date,
) {
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
    const objectivo = await prisma.objectivo.findUnique({
      where: { id: objectivoId },
    });

    if (!objectivo || objectivo.utilizadorId !== user.id) {
      return { success: false, error: "Objectivo não encontrado" };
    }

    const updated = await prisma.objectivo.update({
      where: { id: objectivoId },
      data: {
        titulo,
        descricao,
        categoria: categoria as any,
        prazo,
        updatedAt: new Date(),
      },
      include: {
        subTarefas: true,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating objectivo:", error);
    return { success: false, error: "Erro ao atualizar objectivo" };
  }
}

export async function updateObjectivoStatusAction(
  objectivoId: string,
  status: string,
) {
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
    const objectivo = await prisma.objectivo.findUnique({
      where: { id: objectivoId },
    });

    if (!objectivo || objectivo.utilizadorId !== user.id) {
      return { success: false, error: "Objectivo não encontrado" };
    }

    const updated = await prisma.objectivo.update({
      where: { id: objectivoId },
      data: {
        status: status as any,
        concluidoEm: status === "CONCLUIDO" ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        subTarefas: true,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Erro ao atualizar status" };
  }
}

export async function deleteObjectivoAction(objectivoId: string) {
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
    const objectivo = await prisma.objectivo.findUnique({
      where: { id: objectivoId },
    });

    if (!objectivo || objectivo.utilizadorId !== user.id) {
      return { success: false, error: "Objectivo não encontrado" };
    }

    await prisma.objectivo.delete({
      where: { id: objectivoId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting objectivo:", error);
    return { success: false, error: "Erro ao eliminar objectivo" };
  }
}

export async function addSubtarefaAction(objectivoId: string, titulo: string) {
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
    const objectivo = await prisma.objectivo.findUnique({
      where: { id: objectivoId },
    });

    if (!objectivo || objectivo.utilizadorId !== user.id) {
      return { success: false, error: "Objectivo não encontrado" };
    }

    const subTarefa = await prisma.subTarefaObjectivo.create({
      data: {
        objectivoId,
        titulo,
      },
    });

    return { success: true, data: subTarefa };
  } catch (error) {
    console.error("Error adding subtarefa:", error);
    return { success: false, error: "Erro ao adicionar sub-tarefa" };
  }
}

export async function toggleSubtarefaAction(
  subTarefaId: string,
  objectivoId: string,
) {
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
    const objectivo = await prisma.objectivo.findUnique({
      where: { id: objectivoId },
    });

    if (!objectivo || objectivo.utilizadorId !== user.id) {
      return { success: false, error: "Objectivo não encontrado" };
    }

    const subTarefa = await prisma.subTarefaObjectivo.findUnique({
      where: { id: subTarefaId },
    });

    if (!subTarefa) {
      return { success: false, error: "Sub-tarefa não encontrada" };
    }

    const updated = await prisma.subTarefaObjectivo.update({
      where: { id: subTarefaId },
      data: {
        concluida: !subTarefa.concluida,
        concluidaEm: subTarefa.concluida ? null : new Date(),
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling subtarefa:", error);
    return { success: false, error: "Erro ao atualizar sub-tarefa" };
  }
}

export async function markHabitTodayAction(objectivoId: string) {
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

    const objectivo = await prisma.objectivo.findUnique({
      where: { id: objectivoId },
      include: { subTarefas: true },
    });

    if (!objectivo || objectivo.utilizadorId !== user.id) {
      return { success: false, error: "Objectivo não encontrado" };
    }

    if (objectivo.categoria !== "HABITO") {
      return { success: false, error: "Este objectivo não é um hábito" };
    }

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const todayLog = objectivo.subTarefas.find((subtarefa) => {
      const sourceDate = subtarefa.concluidaEm || subtarefa.createdAt;
      return sourceDate.toISOString().slice(0, 10) === todayKey;
    });

    const subTarefa = todayLog
      ? await prisma.subTarefaObjectivo.update({
          where: { id: todayLog.id },
          data: {
            concluida: !todayLog.concluida,
            concluidaEm: todayLog.concluida ? null : now,
          },
        })
      : await prisma.subTarefaObjectivo.create({
          data: {
            objectivoId,
            titulo: "Check-in de hoje",
            concluida: true,
            concluidaEm: now,
          },
        });

    return { success: true, data: subTarefa };
  } catch (error) {
    console.error("Error marking habit:", error);
    return { success: false, error: "Erro ao registar hábito" };
  }
}

export async function deleteSubtarefaAction(
  subTarefaId: string,
  objectivoId: string,
) {
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

    const objectivo = await prisma.objectivo.findUnique({
      where: { id: objectivoId },
    });

    if (!objectivo || objectivo.utilizadorId !== user.id) {
      return { success: false, error: "Objectivo não encontrado" };
    }

    await prisma.subTarefaObjectivo.delete({
      where: { id: subTarefaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting subtarefa:", error);
    return { success: false, error: "Erro ao eliminar sub-tarefa" };
  }
}
