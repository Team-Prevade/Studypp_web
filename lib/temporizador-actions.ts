"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export type TemporizadorData = {
  disciplinas: { id: string; nome: string; cor: string }[];
  sessoesHoje: Array<{
    id: string;
    iniciadaEm: Date;
    terminadaEm: Date | null;
    duracaoReal: number | null;
    duracaoPrevista: number;
    disciplina: { id: string; nome: string; cor: string } | null;
  }>;
  totalMinutosHoje: number;
  totalMinutosSemana: number;
  weeklyOverview: { dia: string; minutos: number }[];
};

export async function getTemporizadorAction() {
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

    const disciplinas = await prisma.disciplina.findMany({
      where: { utilizadorId: user.id },
      select: {
        id: true,
        nome: true,
        cor: true,
      },
      orderBy: { ordem: "asc" },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sessoesHoje = await prisma.sessaoEstudo.findMany({
      where: {
        utilizadorId: user.id,
        status: "CONCLUIDA",
        iniciadaEm: {
          gte: startOfToday,
        },
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
      orderBy: {
        iniciadaEm: "desc",
      },
    });

    const weeklyStart = new Date(startOfToday);
    weeklyStart.setDate(weeklyStart.getDate() - weeklyStart.getDay() + 1);

    const sessoesSemana = await prisma.sessaoEstudo.findMany({
      where: {
        utilizadorId: user.id,
        status: "CONCLUIDA",
        tipo: "ESTUDO",
        iniciadaEm: {
          gte: weeklyStart,
        },
      },
      orderBy: {
        iniciadaEm: "asc",
      },
    });

    const totalMinutosHoje = sessoesHoje.reduce((sum, sessao) => {
      if (sessao.iniciadaEm && sessao.terminadaEm) {
        return (
          sum +
          Math.max(
            0,
            Math.floor(
              (sessao.terminadaEm.getTime() - sessao.iniciadaEm.getTime()) /
                1000 /
                60,
            ),
          )
        );
      }
      return sum + (sessao.duracaoReal || sessao.duracaoPrevista || 0);
    }, 0);

    const totalMinutosSemana = sessoesSemana.reduce((sum, sessao) => {
      if (sessao.iniciadaEm && sessao.terminadaEm) {
        return (
          sum +
          Math.max(
            0,
            Math.floor(
              (sessao.terminadaEm.getTime() - sessao.iniciadaEm.getTime()) /
                1000 /
                60,
            ),
          )
        );
      }
      return sum + (sessao.duracaoReal || sessao.duracaoPrevista || 0);
    }, 0);

    const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const weeklyMap = new Array(7).fill(0);

    sessoesSemana.forEach((sessao) => {
      const date = new Date(sessao.iniciadaEm);
      const dayIndex = (date.getDay() + 6) % 7;
      const minutes = sessao.duracaoReal || sessao.duracaoPrevista || 0;
      weeklyMap[dayIndex] += minutes;
    });

    const weeklyOverview = diasSemana.map((dia, index) => ({
      dia,
      minutos: weeklyMap[index],
    }));

    return {
      success: true,
      data: {
        disciplinas,
        sessoesHoje,
        totalMinutosHoje,
        totalMinutosSemana,
        weeklyOverview,
      },
    };
  } catch (error) {
    console.error("Error fetching temporizador data:", error);
    return {
      success: false,
      error: "Erro ao carregar temporizador",
      data: null,
    };
  }
}

export async function saveSessaoEstudoAction(
  disciplinaId: string,
  duracaoPrevista: number,
  duracaoReal: number,
  notas?: string,
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

    const created = await prisma.sessaoEstudo.create({
      data: {
        utilizadorId: user.id,
        disciplinaId: disciplinaId || null,
        tipo: "ESTUDO",
        duracaoPrevista,
        duracaoReal,
        status: "CONCLUIDA",
        terminadaEm: new Date(),
        notas: notas || null,
      },
    });

    return { success: true, data: created };
  } catch (error) {
    console.error("Error saving study session:", error);
    return { success: false, error: "Erro ao guardar sessão" };
  }
}
