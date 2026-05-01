"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getInicioDaSemana, mapDiaSemana } from "@/lib/date-utils";

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
