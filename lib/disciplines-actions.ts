"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getDisciplinesAction() {
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

    // Fetch disciplines
    const disciplinas = await prisma.disciplina.findMany({
      where: {
        utilizadorId: user.id,
      },
      include: {
        _count: {
          select: { aulas: true, tarefas: true, notas: true },
        },
      },
      orderBy: { ordem: "asc" },
    });

    return {
      success: true,
      data: {
        disciplinas,
      },
    };
  } catch (error) {
    console.error("Error fetching disciplines:", error);
    return {
      success: false,
      error: "Erro ao carregar disciplinas",
      data: null,
    };
  }
}

export async function updateDisciplineAction(
  disciplinaId: string,
  nome: string,
  cor: string,
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
    const disciplina = await prisma.disciplina.findUnique({
      where: { id: disciplinaId },
    });

    if (!disciplina || disciplina.utilizadorId !== user.id) {
      return { success: false, error: "Disciplina não encontrada" };
    }

    // Update discipline
    await prisma.disciplina.update({
      where: { id: disciplinaId },
      data: {
        nome,
        cor,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating discipline:", error);
    return { success: false, error: "Erro ao atualizar disciplina" };
  }
}

export async function deleteDisciplineAction(disciplinaId: string) {
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
    const disciplina = await prisma.disciplina.findUnique({
      where: { id: disciplinaId },
    });

    if (!disciplina || disciplina.utilizadorId !== user.id) {
      return { success: false, error: "Disciplina não encontrada" };
    }

    // Delete discipline
    await prisma.disciplina.delete({
      where: { id: disciplinaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting discipline:", error);
    return { success: false, error: "Erro ao eliminar disciplina" };
  }
}
