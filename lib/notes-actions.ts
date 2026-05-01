"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getNotesAction() {
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

    // Fetch notes
    const notas = await prisma.nota.findMany({
      where: {
        utilizadorId: user.id,
      },
      include: {
        disciplina: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch disciplines
    const disciplinas = await prisma.disciplina.findMany({
      where: {
        utilizadorId: user.id,
      },
      orderBy: { ordem: "asc" },
    });

    // Group notes by discipline
    const notasPorDisciplina: {
      [key: string]: any[];
    } = {};
    disciplinas.forEach((d) => {
      notasPorDisciplina[d.id] = notas.filter((n) => n.disciplinaId === d.id);
    });

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
    return {
      success: false,
      error: "Erro ao carregar notas",
      data: null,
    };
  }
}

export async function createNoteAction(
  disciplinaId: string,
  titulo: string,
  conteudo: string,
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

    // Create note
    const nota = await prisma.nota.create({
      data: {
        titulo,
        conteudo,
        disciplinaId,
        utilizadorId: user.id,
      },
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
    const nota = await prisma.nota.findUnique({
      where: { id: notaId },
    });

    if (!nota || nota.utilizadorId !== user.id) {
      return { success: false, error: "Nota não encontrada" };
    }

    // Update note
    await prisma.nota.update({
      where: { id: notaId },
      data: {
        titulo,
        conteudo,
        updatedAt: new Date(),
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
    const nota = await prisma.nota.findUnique({
      where: { id: notaId },
    });

    if (!nota || nota.utilizadorId !== user.id) {
      return { success: false, error: "Nota não encontrada" };
    }

    // Delete note
    await prisma.nota.delete({
      where: { id: notaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting note:", error);
    return { success: false, error: "Erro ao eliminar nota" };
  }
}
