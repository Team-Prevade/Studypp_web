"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { mapDiaSemana, getInicioDaSemana, getFimDaSemana } from "@/lib/date-utils";

export async function getDashboardDataAction() {
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

    // Aulas de hoje
    const hoje = new Date();
    const diaSemana = mapDiaSemana(hoje.getDay());

    const aulasHoje = await prisma.aula.findMany({
      where: {
        utilizadorId: user.id,
        diaSemana,
      },
      include: { disciplina: true },
      orderBy: { horaInicio: "asc" },
    });

    // Tarefas pendentes (próximas 5)
    const tarefasPendentes = await prisma.tarefa.findMany({
      where: {
        utilizadorId: user.id,
        status: { in: ["PENDENTE", "ATRASADA"] },
      },
      include: { disciplina: true },
      orderBy: { prazo: "asc" },
      take: 5,
    });

    // Contar tarefas para hoje
    const amanhaComeco = new Date(hoje);
    amanhaComeco.setDate(amanhaComeco.getDate() + 1);
    amanhaComeco.setHours(0, 0, 0, 0);

    const tarefasHoje = await prisma.tarefa.findMany({
      where: {
        utilizadorId: user.id,
        status: { in: ["PENDENTE", "ATRASADA"] },
        prazo: {
          gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
          lt: amanhaComeco,
        },
      },
    });

    // Horas de estudo esta semana
    const inicio = getInicioDaSemana(hoje);
    const fim = getFimDaSemana(hoje);

    const sessoes = await prisma.sessaoEstudo.findMany({
      where: {
        utilizadorId: user.id,
        tipo: "ESTUDO",
        status: "CONCLUIDA",
        iniciadaEm: {
          gte: inicio,
          lte: fim,
        },
      },
    });

    // Calcular total de minutos de estudo
    const totalMinutosEstudo = sessoes.reduce((sum, s) => {
      if (s.iniciadaEm && s.terminadaEm) {
        const diff = s.terminadaEm.getTime() - s.iniciadaEm.getTime();
        return sum + Math.floor(diff / 1000 / 60);
      }
      return sum;
    }, 0);

    // Média geral (todas as avaliações)
    const todasAvaliacoes = await prisma.avaliacao.findMany({
      where: {
        utilizadorId: user.id,
        nota: { not: null },
      },
    });

    let mediaGeral = 0;
    if (todasAvaliacoes.length > 0) {
      const somaNotas = todasAvaliacoes.reduce((sum, a) => sum + (a.nota || 0), 0);
      mediaGeral = somaNotas / todasAvaliacoes.length;
    }

    // Próximo teste/avaliação
    const proximoTeste = await prisma.avaliacao.findFirst({
      where: {
        utilizadorId: user.id,
        data: {
          gte: hoje,
        },
      },
      include: { disciplina: true },
      orderBy: { data: "asc" },
    });

    return {
      success: true,
      data: {
        user: {
          nome: user.nome,
          email: user.email,
        },
        aulasHoje,
        tarefasPendentes,
        totalTarefasHoje: tarefasHoje.length,
        totalMinutosEstudo,
        mediaGeral: Math.round(mediaGeral * 10) / 10,
        proximoTeste,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { success: false, error: "Erro ao carregar dados do dashboard" };
  }
}
