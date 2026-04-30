"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function updatePerfilAction(nome: string, avatar?: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado" };
    }

    const updated = await prisma.utilizador.update({
      where: { email: session.user.email },
      data: {
        nome: nome.trim(),
        ...(avatar && { avatar }),
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating perfil:", error);
    return { success: false, error: "Erro ao atualizar perfil" };
  }
}

export async function addDisciplinaAction(nome: string, cor: string) {
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

    // Get the next order number
    const lastDisciplina = await prisma.disciplina.findFirst({
      where: { utilizadorId: user.id },
      orderBy: { ordem: "desc" },
    });

    const nextOrder = (lastDisciplina?.ordem ?? 0) + 1;

    const disciplina = await prisma.disciplina.create({
      data: {
        nome: nome.trim(),
        cor: cor.toUpperCase(),
        utilizadorId: user.id,
        ordem: nextOrder,
      },
    });

    return { success: true, data: disciplina };
  } catch (error) {
    console.error("Error adding disciplina:", error);
    return { success: false, error: "Erro ao adicionar disciplina" };
  }
}

export async function removeDisciplinaAction(disciplinaId: string) {
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
    const disciplina = await prisma.disciplina.findFirst({
      where: { id: disciplinaId, utilizadorId: user.id },
    });

    if (!disciplina) {
      return { success: false, error: "Disciplina não encontrada" };
    }

    // Delete associated classes
    await prisma.aula.deleteMany({
      where: { disciplinaId },
    });

    // Delete disciplina
    await prisma.disciplina.delete({
      where: { id: disciplinaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing disciplina:", error);
    return { success: false, error: "Erro ao remover disciplina" };
  }
}

interface AulaData {
  disciplinaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
}

export async function saveTimetableAction(aulas: AulaData[]) {
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

    // Delete existing classes for this user
    await prisma.aula.deleteMany({
      where: {
        disciplina: { utilizadorId: user.id },
      },
    });

    // Create new classes
    const createdAulas = await Promise.all(
      aulas.map((aula) =>
        prisma.aula.create({
          data: {
            disciplinaId: aula.disciplinaId,
            diaSemana: aula.diaSemana,
            horaInicio: aula.horaInicio,
            horaFim: aula.horaFim,
            repetir: "SEMANAL",
          },
        }),
      ),
    );

    return { success: true, data: createdAulas };
  } catch (error) {
    console.error("Error saving timetable:", error);
    return { success: false, error: "Erro ao guardar horário" };
  }
}

export async function completeOnboardingAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado" };
    }

    const updated = await prisma.utilizador.update({
      where: { email: session.user.email },
      data: { onboardingFeito: true },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "Erro ao completar onboarding" };
  }
}

export async function getDisciplinasAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado", data: [] };
    }

    const user = await prisma.utilizador.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "Utilizador não encontrado", data: [] };
    }

    const disciplinas = await prisma.disciplina.findMany({
      where: { utilizadorId: user.id },
      orderBy: { ordem: "asc" },
    });

    return { success: true, data: disciplinas };
  } catch (error) {
    console.error("Error getting disciplinas:", error);
    return { success: false, error: "Erro ao carregar disciplinas", data: [] };
  }
}
