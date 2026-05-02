"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

type DisciplineInput = {
  nome: string;
  professor?: string | null;
  sala?: string | null;
  notas?: string | null;
  cor: string;
  ordem?: number;
  ativo?: boolean;
};

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

function normalizeInput(input: DisciplineInput) {
  return {
    nome: input.nome.trim(),
    professor: input.professor?.trim() || null,
    sala: input.sala?.trim() || null,
    notas: input.notas?.trim() || null,
    cor: input.cor || "#2563EB",
    ordem: input.ordem ?? 0,
    ativo: input.ativo ?? true,
  };
}

function averageGrade(avaliacoes: Array<{ nota: number | null; peso?: number }>) {
  const graded = avaliacoes.filter((avaliacao) => avaliacao.nota !== null);
  const totalPeso = graded.reduce((sum, avaliacao) => sum + (avaliacao.peso ?? 1), 0);
  if (graded.length === 0 || totalPeso <= 0) return 0;
  const total = graded.reduce(
    (sum, avaliacao) => sum + (avaliacao.nota ?? 0) * (avaliacao.peso ?? 1),
    0,
  );
  return Math.round((total / totalPeso) * 10) / 10;
}

function withStats(disciplina: any) {
  const totalHorasEstudo =
    disciplina.sessoesEstudo.reduce(
      (sum: number, sessao: { duracaoReal: number | null; duracaoPrevista?: number }) =>
        sum + (sessao.duracaoReal || 0),
      0,
    ) / 60;
  const tarefasConcluidas = disciplina.tarefas.filter(
    (tarefa: { status: string }) => tarefa.status === "CONCLUIDA",
  ).length;

  return {
    ...disciplina,
    totalAulas: disciplina.aulas.length,
    totalTarefas: disciplina.tarefas.length,
    tarefasConcluidas,
    totalAvaliacoes: disciplina.avaliacoes.length,
    mediaAvaliacoes: averageGrade(disciplina.avaliacoes),
    totalTestes: disciplina.avaliacoes.filter(
      (avaliacao: { tipo: string }) => avaliacao.tipo === "TESTE",
    ).length,
    totalHorasEstudo: Math.round(totalHorasEstudo * 10) / 10,
    totalApontamentos: disciplina.apontamentos.length,
    totalEventos: disciplina.eventos.length,
  };
}

const disciplineInclude = {
  aulas: {
    orderBy: [{ diaSemana: "asc" as const }, { horaInicio: "asc" as const }],
    select: {
      id: true,
      diaSemana: true,
      horaInicio: true,
      horaFim: true,
      sala: true,
      professor: true,
      repetir: true,
    },
  },
  tarefas: {
    orderBy: [{ prazo: "asc" as const }, { createdAt: "desc" as const }],
    select: {
      id: true,
      titulo: true,
      prazo: true,
      prioridade: true,
      status: true,
      progresso: true,
    },
  },
  avaliacoes: {
    orderBy: { data: "desc" as const },
    select: {
      id: true,
      nome: true,
      tipo: true,
      data: true,
      nota: true,
      peso: true,
    },
  },
  apontamentos: {
    orderBy: { updatedAt: "desc" as const },
    select: {
      id: true,
      titulo: true,
      fixado: true,
      updatedAt: true,
    },
  },
  sessoesEstudo: {
    orderBy: { iniciadaEm: "desc" as const },
    select: {
      id: true,
      tipo: true,
      duracaoPrevista: true,
      duracaoReal: true,
      status: true,
      iniciadaEm: true,
      terminadaEm: true,
    },
  },
  eventos: {
    orderBy: { dataInicio: "desc" as const },
    select: {
      id: true,
      titulo: true,
      tipo: true,
      dataInicio: true,
      dataFim: true,
    },
  },
};

export async function getDisciplinesAction() {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const disciplinas = await prisma.disciplina.findMany({
      where: {
        utilizadorId: user.id,
      },
      include: disciplineInclude,
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });

    return {
      success: true,
      data: {
        disciplinas: disciplinas.map(withStats),
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

export async function getDisciplineAction(disciplinaId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const disciplina = await prisma.disciplina.findUnique({
      where: { id: disciplinaId },
      include: disciplineInclude,
    });

    if (!disciplina || disciplina.utilizadorId !== user.id) {
      return { success: false, error: "Disciplina não encontrada", data: null };
    }

    return { success: true, data: withStats(disciplina) };
  } catch (error) {
    console.error("Error fetching discipline:", error);
    return {
      success: false,
      error: "Erro ao carregar disciplina",
      data: null,
    };
  }
}

export async function createDisciplineAction(
  input: DisciplineInput | string,
  professor?: string,
  cor?: string,
) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const data = normalizeInput(
      typeof input === "string"
        ? {
            nome: input,
            professor,
            cor: cor || "#2563EB",
          }
        : input,
    );
    if (!data.nome) {
      return { success: false, error: "Nome da disciplina obrigatório", data: null };
    }

    const disciplina = await prisma.disciplina.create({
      data: {
        ...data,
        utilizadorId: user.id,
      },
      include: disciplineInclude,
    });

    return { success: true, data: withStats(disciplina) };
  } catch (error: any) {
    console.error("Error creating discipline:", error);
    if (error?.code === "P2002") {
      return { success: false, error: "Já existe uma disciplina com esse nome", data: null };
    }
    return { success: false, error: "Erro ao criar disciplina", data: null };
  }
}

export async function updateDisciplineAction(
  disciplinaId: string,
  input: DisciplineInput | string,
  cor?: string,
) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const existente = await prisma.disciplina.findUnique({
      where: { id: disciplinaId },
    });

    if (!existente || existente.utilizadorId !== user.id) {
      return { success: false, error: "Disciplina não encontrada", data: null };
    }

    const data = normalizeInput(
      typeof input === "string"
        ? {
            nome: input,
            professor: existente.professor,
            sala: existente.sala,
            notas: existente.notas,
            cor: cor || existente.cor,
            ordem: existente.ordem,
            ativo: existente.ativo,
          }
        : input,
    );
    if (!data.nome) {
      return { success: false, error: "Nome da disciplina obrigatório", data: null };
    }

    const disciplina = await prisma.disciplina.update({
      where: { id: disciplinaId },
      data,
      include: disciplineInclude,
    });

    return { success: true, data: withStats(disciplina) };
  } catch (error: any) {
    console.error("Error updating discipline:", error);
    if (error?.code === "P2002") {
      return { success: false, error: "Já existe uma disciplina com esse nome", data: null };
    }
    return { success: false, error: "Erro ao atualizar disciplina", data: null };
  }
}

export async function deleteDisciplineAction(disciplinaId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error };
    }

    const disciplina = await prisma.disciplina.findUnique({
      where: { id: disciplinaId },
      include: {
        _count: {
          select: {
            aulas: true,
            tarefas: true,
            avaliacoes: true,
            apontamentos: true,
            sessoesEstudo: true,
            eventos: true,
          },
        },
      },
    });

    if (!disciplina || disciplina.utilizadorId !== user.id) {
      return { success: false, error: "Disciplina não encontrada" };
    }

    await prisma.disciplina.delete({
      where: { id: disciplinaId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting discipline:", error);
    return { success: false, error: "Erro ao eliminar disciplina" };
  }
}
