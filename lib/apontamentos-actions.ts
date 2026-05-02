"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { DiaSemana } from "@prisma/client";

type ApontamentoInput = {
  titulo: string;
  conteudo?: string | null;
  disciplinaId?: string | null;
  tipo?: string;
  parentId?: string | null;
  aulaId?: string | null;
  tarefaId?: string | null;
  fixado?: boolean;
};

const NOTE_TYPES = new Set(["LIVRE", "RESUMO", "TPC", "ESTUDO", "EXAME", "PROJECTO"]);
const MAX_TITLE_LENGTH = 160;
const MAX_CONTENT_LENGTH = 95 * 1024 * 1024;

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

async function assertOwner(
  model: "disciplina" | "apontamento" | "aula" | "tarefa",
  id: string | null | undefined,
  utilizadorId: string,
) {
  if (!id) return true;

  if (model === "disciplina") {
    const item = await prisma.disciplina.findUnique({ where: { id }, select: { utilizadorId: true } });
    return item?.utilizadorId === utilizadorId;
  }

  if (model === "apontamento") {
    const item = await prisma.apontamento.findUnique({ where: { id }, select: { utilizadorId: true } });
    return item?.utilizadorId === utilizadorId;
  }

  if (model === "aula") {
    const item = await prisma.aula.findUnique({ where: { id }, select: { utilizadorId: true } });
    return item?.utilizadorId === utilizadorId;
  }

  const item = await prisma.tarefa.findUnique({ where: { id }, select: { utilizadorId: true } });
  return item?.utilizadorId === utilizadorId;
}

function normalizeInput(input: ApontamentoInput) {
  return {
    titulo: (input.titulo.trim() || "Sem titulo").slice(0, MAX_TITLE_LENGTH),
    conteudo: input.conteudo?.trim() || null,
    disciplinaId: input.disciplinaId || null,
    tipo: NOTE_TYPES.has(input.tipo || "") ? input.tipo || "LIVRE" : "LIVRE",
    parentId: input.parentId || null,
    aulaId: input.aulaId || null,
    tarefaId: input.tarefaId || null,
    fixado: input.fixado ?? false,
  };
}

function validateContentSize(conteudo: string | null) {
  return !conteudo || Buffer.byteLength(conteudo, "utf8") <= MAX_CONTENT_LENGTH;
}

async function validateRelations(data: ReturnType<typeof normalizeInput>, utilizadorId: string) {
  const checks = await Promise.all([
    assertOwner("disciplina", data.disciplinaId, utilizadorId),
    assertOwner("apontamento", data.parentId, utilizadorId),
    assertOwner("aula", data.aulaId, utilizadorId),
    assertOwner("tarefa", data.tarefaId, utilizadorId),
  ]);

  return checks.every(Boolean);
}

async function wouldCreateParentCycle(
  apontamentoId: string,
  parentId: string | null,
  utilizadorId: string,
) {
  let currentParentId = parentId;
  const visited = new Set<string>();

  while (currentParentId) {
    if (currentParentId === apontamentoId || visited.has(currentParentId)) return true;
    visited.add(currentParentId);

    const parent = await prisma.apontamento.findFirst({
      where: { id: currentParentId, utilizadorId },
      select: { parentId: true },
    });

    currentParentId = parent?.parentId ?? null;
  }

  return false;
}

function removeNoteReferences(html: string | null, apontamentoId: string) {
  if (!html) return html;
  const escapedId = apontamentoId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html
    .replace(
      new RegExp(`<a\\b[^>]*data-note-ref=["']${escapedId}["'][^>]*>.*?<\\/a>`, "gis"),
      '<span class="broken-note-reference">@nota removida</span>',
    )
    .replace(
      new RegExp(`<a\\b[^>]*href=["']\\/apontamentos\\/${escapedId}["'][^>]*>.*?<\\/a>`, "gis"),
      '<span class="broken-note-reference">@nota removida</span>',
    );
}

const apontamentoInclude = {
  disciplina: {
    select: {
      id: true,
      nome: true,
      cor: true,
    },
  },
  parent: {
    select: {
      id: true,
      titulo: true,
    },
  },
  subNotas: {
    select: {
      id: true,
      titulo: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc" as const,
    },
  },
  aula: {
    select: {
      id: true,
      diaSemana: true,
      horaInicio: true,
      horaFim: true,
      disciplina: {
        select: {
          nome: true,
          cor: true,
        },
      },
    },
  },
  tarefa: {
    select: {
      id: true,
      titulo: true,
      prazo: true,
      status: true,
    },
  },
};

export async function getApontamentosAction() {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error, data: null };

    const [apontamentos, disciplinas, context] = await Promise.all([
      prisma.apontamento.findMany({
        where: { utilizadorId: user.id },
        include: apontamentoInclude,
        orderBy: [{ fixado: "desc" }, { updatedAt: "desc" }],
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
      getContextForUser(user.id),
    ]);

    return {
      success: true,
      data: {
        apontamentos,
        disciplinas,
        ...context,
      },
    };
  } catch (error) {
    console.error("Error fetching apontamentos:", error);
    return { success: false, error: "Erro ao carregar apontamentos", data: null };
  }
}

export async function getApontamentoByIdAction(apontamentoId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error, data: null };

    const apontamento = await prisma.apontamento.findFirst({
      where: { id: apontamentoId, utilizadorId: user.id },
      include: apontamentoInclude,
    });

    if (!apontamento) {
      return { success: false, error: "Apontamento não encontrado", data: null };
    }

    return { success: true, data: apontamento };
  } catch (error) {
    console.error("Error fetching apontamento:", error);
    return { success: false, error: "Erro ao carregar apontamento", data: null };
  }
}

async function getContextForUser(utilizadorId: string) {
  const today = new Date();
  const diaSemana = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"][today.getDay()] as DiaSemana;

  const [aulas, tarefas] = await Promise.all([
    prisma.aula.findMany({
      where: {
        utilizadorId,
        diaSemana,
      },
      select: {
        id: true,
        horaInicio: true,
        horaFim: true,
        disciplina: {
          select: {
            nome: true,
            cor: true,
          },
        },
      },
      orderBy: { horaInicio: "asc" },
      take: 8,
    }),
    prisma.tarefa.findMany({
      where: {
        utilizadorId,
        status: { in: ["PENDENTE", "ATRASADA"] },
      },
      select: {
        id: true,
        titulo: true,
        prazo: true,
        disciplina: {
          select: {
            nome: true,
            cor: true,
          },
        },
      },
      orderBy: [{ prazo: "asc" }, { updatedAt: "desc" }],
      take: 10,
    }),
  ]);

  return { aulas, tarefas };
}

export async function createApontamentoAction(
  input: ApontamentoInput | string,
  conteudo?: string,
  disciplinaId?: string,
) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error, data: null };

    const data = normalizeInput(
      typeof input === "string" ? { titulo: input, conteudo, disciplinaId } : input,
    );

    if (!validateContentSize(data.conteudo)) {
      return { success: false, error: "O conte?do do apontamento ? demasiado grande", data: null };
    }

    if (!(await validateRelations(data, user.id))) {
      return { success: false, error: "Relação inválida", data: null };
    }

    const apontamento = await prisma.apontamento.create({
      data: {
        utilizadorId: user.id,
        ...data,
      },
      include: apontamentoInclude,
    });

    return { success: true, data: apontamento };
  } catch (error) {
    console.error("Error creating apontamento:", error);
    return { success: false, error: "Erro ao criar apontamento", data: null };
  }
}

export async function updateApontamentoAction(
  apontamentoId: string,
  input: ApontamentoInput | string,
  conteudo?: string,
  disciplinaId?: string,
) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error, data: null };

    const existente = await prisma.apontamento.findUnique({
      where: { id: apontamentoId },
    });

    if (!existente || existente.utilizadorId !== user.id) {
      return { success: false, error: "Apontamento não encontrado", data: null };
    }

    const data = normalizeInput(
      typeof input === "string"
        ? { titulo: input, conteudo, disciplinaId, fixado: existente.fixado }
        : { ...input, fixado: input.fixado ?? existente.fixado },
    );

    if (data.parentId === apontamentoId) {
      return { success: false, error: "Uma nota não pode ser sub-nota dela própria", data: null };
    }

    if (!validateContentSize(data.conteudo)) {
      return { success: false, error: "O conte?do do apontamento ? demasiado grande", data: null };
    }

    if (!(await validateRelations(data, user.id))) {
      return { success: false, error: "Relação inválida", data: null };
    }

    if (await wouldCreateParentCycle(apontamentoId, data.parentId, user.id)) {
      return { success: false, error: "Esta liga??o criaria um ciclo entre sub-notas", data: null };
    }

    const updated = await prisma.apontamento.update({
      where: { id: apontamentoId },
      data,
      include: apontamentoInclude,
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating apontamento:", error);
    return { success: false, error: "Erro ao atualizar apontamento", data: null };
  }
}

export async function deleteApontamentoAction(apontamentoId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error };

    const apontamento = await prisma.apontamento.findUnique({
      where: { id: apontamentoId },
    });

    if (!apontamento || apontamento.utilizadorId !== user.id) {
      return { success: false, error: "Apontamento não encontrado" };
    }

    const referencingNotes = await prisma.apontamento.findMany({
      where: {
        utilizadorId: user.id,
        conteudo: {
          contains: apontamentoId,
        },
        NOT: {
          id: apontamentoId,
        },
      },
      select: {
        id: true,
        conteudo: true,
      },
    });

    await prisma.$transaction([
      ...referencingNotes.map((note) =>
        prisma.apontamento.update({
          where: { id: note.id },
          data: {
            conteudo: removeNoteReferences(note.conteudo, apontamentoId),
          },
        }),
      ),
      prisma.apontamento.delete({ where: { id: apontamentoId } }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting apontamento:", error);
    return { success: false, error: "Erro ao eliminar apontamento" };
  }
}

export async function togglePinApontamentoAction(apontamentoId: string) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error, data: null };

    const apontamento = await prisma.apontamento.findUnique({
      where: { id: apontamentoId },
    });

    if (!apontamento || apontamento.utilizadorId !== user.id) {
      return { success: false, error: "Apontamento não encontrado", data: null };
    }

    const updated = await prisma.apontamento.update({
      where: { id: apontamentoId },
      data: { fixado: !apontamento.fixado },
      include: apontamentoInclude,
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling pin:", error);
    return { success: false, error: "Erro ao fixar apontamento", data: null };
  }
}
