"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getInicioDaSemana } from "@/lib/date-utils";
import { DiaSemana } from "@prisma/client";

export async function getTimetableAction(startDate: Date) {
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

    // Get the start of the week (Monday)
    const inicio = getInicioDaSemana(startDate);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6); // End of week (Sunday)
    fim.setHours(23, 59, 59, 999);

    // Fetch all classes for this user
    const aulas = await prisma.aula.findMany({
      where: {
        utilizadorId: user.id,
      },
      include: {
        disciplina: true,
      },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    });

    // Get unique hours from all classes
    const horasSet = new Set<string>();
    aulas.forEach((aula) => {
      horasSet.add(aula.horaInicio);
      horasSet.add(aula.horaFim);
    });

    // Generate hours from 7:00 to 20:00 (or based on actual classes)
    const horas: string[] = [];
    for (let h = 7; h < 20; h++) {
      horas.push(`${String(h).padStart(2, "0")}:00`);
    }

    // If there are classes with specific times, include them
    horasSet.forEach((hora) => {
      if (!horas.includes(hora)) {
        horas.push(hora);
      }
    });

    horas.sort();

    // Group classes by day of week
    const diasSemana = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"];
    const aulasPerDay: Record<string, any[]> = {};

    diasSemana.forEach((dia) => {
      aulasPerDay[dia] = aulas.filter((a) => a.diaSemana === dia);
    });

    return {
      success: true,
      data: {
        startDate: inicio,
        endDate: fim,
        horas,
        aulasPerDay,
        aulas,
      },
    };
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return { success: false, error: "Erro ao carregar horário", data: null };
  }
}

export async function createAulaAction(input: {
  disciplinaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  sala?: string;
}) {
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

    const disciplina = await prisma.disciplina.findUnique({
      where: { id: input.disciplinaId },
    });

    if (!disciplina || disciplina.utilizadorId !== user.id) {
      return { success: false, error: "Disciplina inválida", data: null };
    }

    if (input.horaInicio >= input.horaFim) {
      return { success: false, error: "Intervalo de horas inválido", data: null };
    }

    const overlap = await prisma.aula.findFirst({
      where: {
        utilizadorId: user.id,
        diaSemana: input.diaSemana as DiaSemana,
        NOT: [
          { horaFim: { lte: input.horaInicio } },
          { horaInicio: { gte: input.horaFim } },
        ],
      },
    });

    if (overlap) {
      return {
        success: false,
        error: "Já existe uma aula neste horário",
        data: null,
      };
    }

    const aula = await prisma.aula.create({
      data: {
        utilizadorId: user.id,
        disciplinaId: input.disciplinaId,
        diaSemana: input.diaSemana as DiaSemana,
        horaInicio: input.horaInicio,
        horaFim: input.horaFim,
        sala: input.sala || null,
      },
      include: {
        disciplina: true,
      },
    });

    return { success: true, data: aula };
  } catch (error) {
    console.error("Error creating class:", error);
    return { success: false, error: "Erro ao adicionar aula", data: null };
  }
}

export async function deleteAulaAction(aulaId: string) {
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

    const aula = await prisma.aula.findUnique({
      where: { id: aulaId },
    });

    if (!aula || aula.utilizadorId !== user.id) {
      return { success: false, error: "Aula não encontrada" };
    }

    await prisma.aula.delete({
      where: { id: aulaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting class:", error);
    return { success: false, error: "Erro ao remover aula" };
  }
}

export async function updateAulaAction(input: {
  aulaId: string;
  disciplinaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  sala?: string;
}) {
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

    const aula = await prisma.aula.findUnique({
      where: { id: input.aulaId },
    });

    if (!aula || aula.utilizadorId !== user.id) {
      return { success: false, error: "Aula não encontrada", data: null };
    }

    const disciplina = await prisma.disciplina.findUnique({
      where: { id: input.disciplinaId },
    });

    if (!disciplina || disciplina.utilizadorId !== user.id) {
      return { success: false, error: "Disciplina inválida", data: null };
    }

    if (input.horaInicio >= input.horaFim) {
      return { success: false, error: "Intervalo de horas inválido", data: null };
    }

    const overlap = await prisma.aula.findFirst({
      where: {
        utilizadorId: user.id,
        diaSemana: input.diaSemana as DiaSemana,
        id: { not: input.aulaId },
        NOT: [
          { horaFim: { lte: input.horaInicio } },
          { horaInicio: { gte: input.horaFim } },
        ],
      },
    });

    if (overlap) {
      return {
        success: false,
        error: "Já existe uma aula neste horário",
        data: null,
      };
    }

    const updated = await prisma.aula.update({
      where: { id: input.aulaId },
      data: {
        disciplinaId: input.disciplinaId,
        diaSemana: input.diaSemana as DiaSemana,
        horaInicio: input.horaInicio,
        horaFim: input.horaFim,
        sala: input.sala || null,
      },
      include: {
        disciplina: true,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating class:", error);
    return { success: false, error: "Erro ao atualizar aula", data: null };
  }
}
