"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { DiaSemana, RepetirAula } from "@prisma/client";
import {
  mapDiaSemana,
  getInicioDaSemana,
  getFimDaSemana,
} from "@/lib/date-utils";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function isSameDay(a?: Date | null, b = new Date()) {
  if (!a) return false;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function shouldShowClassToday(
  aula: {
    diaSemana: DiaSemana;
    repetir: RepetirAula;
    dataInicio: Date | null;
    dataFim: Date | null;
  },
  today: Date,
) {
  if (aula.repetir === "UMA_VEZ") {
    return aula.dataInicio ? isSameDay(aula.dataInicio, today) : aula.diaSemana === mapDiaSemana(today.getDay());
  }

  if (aula.dataInicio && startOfDay(aula.dataInicio) > endOfDay(today)) return false;
  if (aula.dataFim && endOfDay(aula.dataFim) < startOfDay(today)) return false;

  if (aula.repetir === "QUINZENAL" && aula.dataInicio) {
    const days = Math.floor((startOfDay(today).getTime() - startOfDay(aula.dataInicio).getTime()) / 86400000);
    const weeks = Math.floor(days / 7);
    return weeks >= 0 && weeks % 2 === 0;
  }

  return true;
}

export async function getDashboardDataAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado" };
    }

    const user = await prisma.utilizador.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    if (!user) {
      return { success: false, error: "Utilizador não encontrado" };
    }

    const hoje = new Date();
    const inicioHoje = startOfDay(hoje);
    const fimHoje = endOfDay(hoje);
    const inicioSemana = getInicioDaSemana(hoje);
    const fimSemana = getFimDaSemana(hoje);
    const diaSemana = mapDiaSemana(hoje.getDay()) as DiaSemana;

    const [
      aulasRaw,
      tarefasPendentesRaw,
      totalTarefasHoje,
      sessoes,
      avaliacoesComNota,
      proximoTeste,
    ] = await Promise.all([
      prisma.aula.findMany({
        where: {
          utilizadorId: user.id,
          diaSemana,
          disciplina: {
            ativo: true,
          },
        },
        select: {
          id: true,
          diaSemana: true,
          horaInicio: true,
          horaFim: true,
          repetir: true,
          dataInicio: true,
          dataFim: true,
          sala: true,
          disciplina: {
            select: {
              nome: true,
              cor: true,
            },
          },
        },
        orderBy: { horaInicio: "asc" },
      }),
      prisma.tarefa.findMany({
        where: {
          utilizadorId: user.id,
          status: { in: ["PENDENTE", "ATRASADA"] },
          prazo: { not: null },
        },
        select: {
          id: true,
          titulo: true,
          descricao: true,
          prazo: true,
          status: true,
          prioridade: true,
          disciplina: {
            select: {
              nome: true,
              cor: true,
            },
          },
        },
        orderBy: [{ prazo: "asc" }, { prioridade: "asc" }],
        take: 5,
      }),
      prisma.tarefa.count({
        where: {
          utilizadorId: user.id,
          status: { in: ["PENDENTE", "ATRASADA"] },
          prazo: {
            gte: inicioHoje,
            lte: fimHoje,
          },
        },
      }),
      prisma.sessaoEstudo.findMany({
        where: {
          utilizadorId: user.id,
          tipo: "ESTUDO",
          status: "CONCLUIDA",
          iniciadaEm: {
            gte: inicioSemana,
            lte: fimSemana,
          },
        },
        select: {
          iniciadaEm: true,
          terminadaEm: true,
          duracaoReal: true,
          duracaoPrevista: true,
        },
      }),
      prisma.avaliacao.findMany({
        where: {
          utilizadorId: user.id,
          nota: { not: null },
        },
        select: {
          nota: true,
          peso: true,
        },
      }),
      prisma.avaliacao.findFirst({
        where: {
          utilizadorId: user.id,
          tipo: "TESTE",
          data: {
            gte: inicioHoje,
          },
        },
        select: {
          id: true,
          nome: true,
          data: true,
          tipo: true,
          disciplina: {
            select: {
              nome: true,
              cor: true,
            },
          },
        },
        orderBy: { data: "asc" },
      }),
    ]);

    const aulasHoje = aulasRaw.filter((aula) => shouldShowClassToday(aula, hoje));

    const tarefasPendentes = tarefasPendentesRaw.map((tarefa) => ({
      ...tarefa,
      statusCalculado:
        tarefa.status === "ATRASADA" || (tarefa.prazo && tarefa.prazo < inicioHoje)
          ? "ATRASADA"
          : tarefa.status,
    }));

    const totalMinutosEstudo = sessoes.reduce((sum, sessao) => {
      if (sessao.duracaoReal != null) return sum + sessao.duracaoReal;
      if (sessao.terminadaEm) {
        const diff = sessao.terminadaEm.getTime() - sessao.iniciadaEm.getTime();
        return sum + Math.max(0, Math.floor(diff / 1000 / 60));
      }
      return sum + (sessao.duracaoPrevista || 0);
    }, 0);

    const totalPeso = avaliacoesComNota.reduce((sum, avaliacao) => sum + (avaliacao.peso || 1), 0);
    const mediaGeral =
      totalPeso > 0
        ? avaliacoesComNota.reduce(
            (sum, avaliacao) => sum + (avaliacao.nota || 0) * (avaliacao.peso || 1),
            0,
          ) / totalPeso
        : 0;

    return {
      success: true,
      data: {
        user,
        aulasHoje,
        tarefasPendentes,
        totalTarefasHoje,
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
