"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { TipoAvaliacao } from "@prisma/client";

const tipoValues = Object.values(TipoAvaliacao);

type GradeInput = {
  nome: string;
  disciplinaId: string;
  tipo: TipoAvaliacao;
  data: string | Date;
  nota?: number | null;
  peso?: number | null;
  observacoes?: string | null;
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

function parseDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNota(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.min(20, Math.max(0, value));
}

function parsePeso(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return 1;
  return Math.max(0.1, value);
}

function weightedAverage(items: Array<{ nota: number | null; peso: number }>) {
  const graded = items.filter((item) => item.nota !== null);
  const totalPeso = graded.reduce((sum, item) => sum + item.peso, 0);
  if (graded.length === 0 || totalPeso <= 0) return 0;
  const total = graded.reduce((sum, item) => sum + (item.nota ?? 0) * item.peso, 0);
  return Math.round((total / totalPeso) * 10) / 10;
}

async function assertDisciplinaOwner(disciplinaId: string, utilizadorId: string) {
  const disciplina = await prisma.disciplina.findUnique({
    where: { id: disciplinaId },
    select: { utilizadorId: true },
  });

  return disciplina?.utilizadorId === utilizadorId;
}

export async function getGradesAction() {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const [avaliacoes, disciplinas] = await Promise.all([
      prisma.avaliacao.findMany({
        where: {
          utilizadorId: user.id,
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
        orderBy: { data: "desc" },
      }),
      prisma.disciplina.findMany({
        where: {
          utilizadorId: user.id,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          cor: true,
        },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      }),
    ]);

    const mediaGlobal = weightedAverage(avaliacoes);

    const mediasPorDisciplina = disciplinas.map((disciplina) => {
      const avaliacoesDisciplina = avaliacoes.filter(
        (avaliacao) => avaliacao.disciplinaId === disciplina.id,
      );

      return {
        id: disciplina.id,
        nome: disciplina.nome,
        cor: disciplina.cor,
        media: weightedAverage(avaliacoesDisciplina),
        totalNotas: avaliacoesDisciplina.filter((avaliacao) => avaliacao.nota !== null).length,
        totalAvaliacoes: avaliacoesDisciplina.length,
        avaliacoes: avaliacoesDisciplina,
      };
    });

    const notasComValor = avaliacoes.filter((avaliacao) => avaliacao.nota !== null);
    const escalaAvaliacao = {
      excelente: notasComValor.filter((avaliacao) => (avaliacao.nota ?? 0) >= 14).length,
      suficiente: notasComValor.filter(
        (avaliacao) => (avaliacao.nota ?? 0) >= 10 && (avaliacao.nota ?? 0) < 14,
      ).length,
      insuficiente: notasComValor.filter((avaliacao) => (avaliacao.nota ?? 0) < 10).length,
    };

    return {
      success: true,
      data: {
        avaliacoes,
        disciplinas,
        mediaGlobal,
        totalAvaliacoes: notasComValor.length,
        mediasPorDisciplina,
        escalaAvaliacao,
      },
    };
  } catch (error) {
    console.error("Error fetching grades:", error);
    return {
      success: false,
      error: "Erro ao carregar notas",
      data: null,
    };
  }
}

export async function createGradeAction(input: GradeInput) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const nome = input.nome.trim();
    if (!nome) {
      return { success: false, error: "Nome da avaliação obrigatório", data: null };
    }

    if (!(await assertDisciplinaOwner(input.disciplinaId, user.id))) {
      return { success: false, error: "Disciplina inválida", data: null };
    }

    const data = parseDate(input.data);
    if (!data) {
      return { success: false, error: "Data inválida", data: null };
    }

    const tipo = tipoValues.includes(input.tipo) ? input.tipo : TipoAvaliacao.TESTE;

    const avaliacao = await prisma.avaliacao.create({
      data: {
        utilizadorId: user.id,
        disciplinaId: input.disciplinaId,
        nome,
        tipo,
        data,
        nota: parseNota(input.nota),
        peso: parsePeso(input.peso),
        observacoes: input.observacoes?.trim() || null,
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
    });

    return { success: true, data: avaliacao };
  } catch (error) {
    console.error("Error creating grade:", error);
    return { success: false, error: "Erro ao criar nota", data: null };
  }
}

export async function updateGradeAction(input: GradeInput & { avaliacaoId: string }) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const existente = await prisma.avaliacao.findUnique({
      where: { id: input.avaliacaoId },
    });

    if (!existente || existente.utilizadorId !== user.id) {
      return { success: false, error: "Avaliação não encontrada", data: null };
    }

    const nome = input.nome.trim();
    if (!nome) {
      return { success: false, error: "Nome da avaliação obrigatório", data: null };
    }

    if (!(await assertDisciplinaOwner(input.disciplinaId, user.id))) {
      return { success: false, error: "Disciplina inválida", data: null };
    }

    const data = parseDate(input.data);
    if (!data) {
      return { success: false, error: "Data inválida", data: null };
    }

    const tipo = tipoValues.includes(input.tipo) ? input.tipo : existente.tipo;

    const avaliacao = await prisma.avaliacao.update({
      where: { id: input.avaliacaoId },
      data: {
        disciplinaId: input.disciplinaId,
        nome,
        tipo,
        data,
        nota: parseNota(input.nota),
        peso: parsePeso(input.peso),
        observacoes: input.observacoes?.trim() || null,
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
    });

    return { success: true, data: avaliacao };
  } catch (error) {
    console.error("Error updating grade:", error);
    return { success: false, error: "Erro ao atualizar nota", data: null };
  }
}

export async function deleteGradeAction(avaliacaoId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error };
    }

    const existente = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
    });

    if (!existente || existente.utilizadorId !== user.id) {
      return { success: false, error: "Avaliação não encontrada" };
    }

    await prisma.avaliacao.delete({
      where: { id: avaliacaoId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting grade:", error);
    return { success: false, error: "Erro ao eliminar nota" };
  }
}
