"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getCalendarEventsAction(year: number, month: number) {
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

    // Get start and end of month
    const inicio = new Date(year, month, 1);
    const fim = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Fetch events for this month
    const eventos = await prisma.evento.findMany({
      where: {
        utilizadorId: user.id,
        data: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        disciplina: true,
      },
      orderBy: { data: "asc" },
    });

    // Fetch assessments (tests/exams) for this month
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        utilizadorId: user.id,
        data: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        disciplina: true,
      },
      orderBy: { data: "asc" },
    });

    // Fetch tasks with deadlines this month
    const tarefas = await prisma.tarefa.findMany({
      where: {
        utilizadorId: user.id,
        prazo: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        disciplina: true,
      },
      orderBy: { prazo: "asc" },
    });

    return {
      success: true,
      data: {
        eventos,
        avaliacoes,
        tarefas,
        month,
        year,
      },
    };
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return {
      success: false,
      error: "Erro ao carregar eventos do calendário",
      data: null,
    };
  }
}
