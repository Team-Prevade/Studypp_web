"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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

// Backward-compatible aliases for the old "notes" API.
// The current app model stores textual study notes as Apontamento.
export async function getNotesAction() {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error, data: null };

    const [notas, disciplinas] = await Promise.all([
      prisma.apontamento.findMany({
        where: { utilizadorId: user.id },
        include: { disciplina: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.disciplina.findMany({
        where: { utilizadorId: user.id },
        orderBy: { ordem: "asc" },
      }),
    ]);

    const notasPorDisciplina = disciplinas.reduce<Record<string, typeof notas>>((acc, disciplina) => {
      acc[disciplina.id] = notas.filter((nota) => nota.disciplinaId === disciplina.id);
      return acc;
    }, {});

    return {
      success: true,
      data: {
        notas,
        disciplinas,
        notasPorDisciplina,
      },
    };
  } catch (error) {
    console.error("Error fetching notes:", error);
    return { success: false, error: "Erro ao carregar notas", data: null };
  }
}

export async function createNoteAction(
  disciplinaId: string,
  titulo: string,
  conteudo: string,
) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error };

    const disciplina = await prisma.disciplina.findFirst({
      where: { id: disciplinaId, utilizadorId: user.id },
      select: { id: true },
    });

    if (!disciplina) {
      return { success: false, error: "Disciplina não encontrada" };
    }

    const nota = await prisma.apontamento.create({
      data: {
        titulo: titulo.trim() || "Sem título",
        conteudo,
        disciplinaId,
        utilizadorId: user.id,
      },
      include: { disciplina: true },
    });

    return { success: true, data: nota };
  } catch (error) {
    console.error("Error creating note:", error);
    return { success: false, error: "Erro ao criar nota" };
  }
}

export async function updateNoteAction(
  notaId: string,
  titulo: string,
  conteudo: string,
) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error };

    const nota = await prisma.apontamento.findFirst({
      where: { id: notaId, utilizadorId: user.id },
      select: { id: true },
    });

    if (!nota) {
      return { success: false, error: "Nota não encontrada" };
    }

    await prisma.apontamento.update({
      where: { id: notaId },
      data: {
        titulo: titulo.trim() || "Sem título",
        conteudo,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating note:", error);
    return { success: false, error: "Erro ao atualizar nota" };
  }
}

export async function deleteNoteAction(notaId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error };

    const nota = await prisma.apontamento.findFirst({
      where: { id: notaId, utilizadorId: user.id },
      select: { id: true },
    });

    if (!nota) {
      return { success: false, error: "Nota não encontrada" };
    }

    await prisma.apontamento.delete({
      where: { id: notaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting note:", error);
    return { success: false, error: "Erro ao eliminar nota" };
  }
}
