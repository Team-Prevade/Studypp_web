"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

type LembreteInput = {
  titulo: string;
  dataHora: Date;
  disciplinaId?: string | null;
  repetir?: string;
  notas?: string | null;
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

async function attachDiscipline(lembrete: any, utilizadorId: string) {
  if (!lembrete.disciplinaId) return { ...lembrete, disciplina: null };

  const disciplina = await prisma.disciplina.findFirst({
    where: {
      id: lembrete.disciplinaId,
      utilizadorId,
    },
    select: {
      id: true,
      nome: true,
      cor: true,
    },
  });

  return { ...lembrete, disciplina };
}

async function assertDisciplineOwnership(disciplinaId: string | null | undefined, utilizadorId: string) {
  if (!disciplinaId) return true;

  const disciplina = await prisma.disciplina.findUnique({
    where: { id: disciplinaId },
    select: { utilizadorId: true },
  });

  return disciplina?.utilizadorId === utilizadorId;
}

function normalizeInput(input: LembreteInput) {
  return {
    titulo: input.titulo.trim(),
    dataHora: input.dataHora,
    disciplinaId: input.disciplinaId || null,
    repetir: (input.repetir || "NUNCA") as never,
    notas: input.notas?.trim() || null,
  };
}

function groupLembretes(lembretes: any[]) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const endOfTomorrow = new Date(startOfTomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  return {
    atrasados: lembretes.filter((lembrete) => !lembrete.concluido && new Date(lembrete.dataHora) < startOfToday),
    hoje: lembretes.filter((lembrete) => {
      const date = new Date(lembrete.dataHora);
      return date >= startOfToday && date <= endOfToday;
    }),
    amanha: lembretes.filter((lembrete) => {
      const date = new Date(lembrete.dataHora);
      return date >= startOfTomorrow && date <= endOfTomorrow;
    }),
    futuros: lembretes.filter((lembrete) => new Date(lembrete.dataHora) > endOfTomorrow),
  };
}

export async function getLembretesAction() {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const [lembretesRaw, disciplinas] = await Promise.all([
      prisma.lembrete.findMany({
        where: { utilizadorId: user.id },
        orderBy: { dataHora: "asc" },
      }),
      prisma.disciplina.findMany({
        where: { utilizadorId: user.id, ativo: true },
        select: {
          id: true,
          nome: true,
          cor: true,
        },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      }),
    ]);

    const disciplinaById = new Map(disciplinas.map((disciplina) => [disciplina.id, disciplina]));
    const lembretes = lembretesRaw.map((lembrete) => ({
      ...lembrete,
      disciplina: lembrete.disciplinaId ? disciplinaById.get(lembrete.disciplinaId) || null : null,
    }));

    return {
      success: true,
      data: {
        lembretes,
        disciplinas,
        grupos: groupLembretes(lembretes),
      },
    };
  } catch (error) {
    console.error("Error fetching lembretes:", error);
    return {
      success: false,
      error: "Erro ao carregar lembretes",
      data: null,
    };
  }
}

export async function createLembreteAction(
  input: LembreteInput | string,
  dataHora?: Date,
  disciplinaId?: string,
  repetir?: string,
  notas?: string,
) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const data = normalizeInput(
      typeof input === "string"
        ? {
            titulo: input,
            dataHora: dataHora || new Date(),
            disciplinaId,
            repetir,
            notas,
          }
        : input,
    );

    if (!data.titulo) {
      return { success: false, error: "Título obrigatório", data: null };
    }

    const ownsDiscipline = await assertDisciplineOwnership(data.disciplinaId, user.id);
    if (!ownsDiscipline) {
      return { success: false, error: "Disciplina inválida", data: null };
    }

    const lembrete = await prisma.lembrete.create({
      data: {
        utilizadorId: user.id,
        ...data,
      },
    });

    return { success: true, data: await attachDiscipline(lembrete, user.id) };
  } catch (error) {
    console.error("Error creating lembrete:", error);
    return { success: false, error: "Erro ao criar lembrete", data: null };
  }
}

export async function updateLembreteAction(lembreteId: string, input: LembreteInput) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const existente = await prisma.lembrete.findUnique({
      where: { id: lembreteId },
    });

    if (!existente || existente.utilizadorId !== user.id) {
      return { success: false, error: "Lembrete não encontrado", data: null };
    }

    const data = normalizeInput(input);
    if (!data.titulo) {
      return { success: false, error: "Título obrigatório", data: null };
    }

    const ownsDiscipline = await assertDisciplineOwnership(data.disciplinaId, user.id);
    if (!ownsDiscipline) {
      return { success: false, error: "Disciplina inválida", data: null };
    }

    const updated = await prisma.lembrete.update({
      where: { id: lembreteId },
      data,
    });

    return { success: true, data: await attachDiscipline(updated, user.id) };
  } catch (error) {
    console.error("Error updating lembrete:", error);
    return { success: false, error: "Erro ao atualizar lembrete", data: null };
  }
}

export async function toggleLembreteConcluidoAction(lembreteId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error, data: null };
    }

    const lembrete = await prisma.lembrete.findUnique({
      where: { id: lembreteId },
    });

    if (!lembrete || lembrete.utilizadorId !== user.id) {
      return { success: false, error: "Lembrete não encontrado", data: null };
    }

    const updated = await prisma.lembrete.update({
      where: { id: lembreteId },
      data: {
        concluido: !lembrete.concluido,
        concluidoEm: lembrete.concluido ? null : new Date(),
      },
    });

    return { success: true, data: await attachDiscipline(updated, user.id) };
  } catch (error) {
    console.error("Error toggling lembrete:", error);
    return { success: false, error: "Erro ao atualizar lembrete", data: null };
  }
}

export async function deleteLembreteAction(lembreteId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) {
      return { success: false, error };
    }

    const lembrete = await prisma.lembrete.findUnique({
      where: { id: lembreteId },
    });

    if (!lembrete || lembrete.utilizadorId !== user.id) {
      return { success: false, error: "Lembrete não encontrado" };
    }

    await prisma.lembrete.delete({
      where: { id: lembreteId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting lembrete:", error);
    return { success: false, error: "Erro ao eliminar lembrete" };
  }
}
