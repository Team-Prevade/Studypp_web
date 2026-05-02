"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { TipoEvento } from "@prisma/client";

export async function getCalendarDayAction(dataISO: string) {
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

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataISO.trim());
    if (!match) {
      return { success: false, error: "Data inválida", data: null };
    }

    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    const day = Number(match[3]);

    const inicioDia = new Date(y, m, day, 0, 0, 0, 0);
    const fimDia = new Date(y, m, day, 23, 59, 59, 999);

    if (
      Number.isNaN(inicioDia.getTime()) ||
      inicioDia.getFullYear() !== y ||
      inicioDia.getMonth() !== m ||
      inicioDia.getDate() !== day
    ) {
      return { success: false, error: "Data inválida", data: null };
    }

    const eventos = await prisma.evento.findMany({
      where: {
        utilizadorId: user.id,
        AND: [
          { dataInicio: { lte: fimDia } },
          {
            OR: [
              { dataFim: { gte: inicioDia } },
              {
                AND: [
                  { dataFim: null },
                  { dataInicio: { gte: inicioDia } },
                  { dataInicio: { lte: fimDia } },
                ],
              },
            ],
          },
        ],
      },
      include: {
        disciplina: true,
      },
      orderBy: { dataInicio: "asc" },
    });

    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        utilizadorId: user.id,
        data: {
          gte: inicioDia,
          lte: fimDia,
        },
      },
      include: {
        disciplina: true,
      },
      orderBy: { data: "asc" },
    });

    const tarefas = await prisma.tarefa.findMany({
      where: {
        utilizadorId: user.id,
        prazo: {
          gte: inicioDia,
          lte: fimDia,
        },
      },
      include: {
        disciplina: true,
      },
      orderBy: { prazo: "asc" },
    });

    const disciplinas = await prisma.disciplina.findMany({
      where: { utilizadorId: user.id },
      select: {
        id: true,
        nome: true,
        cor: true,
      },
      orderBy: { nome: "asc" },
    });

    return {
      success: true,
      data: {
        dataISO,
        eventos,
        avaliacoes,
        tarefas,
        disciplinas,
      },
    };
  } catch (error) {
    console.error("Error fetching calendar day:", error);
    return {
      success: false,
      error: "Erro ao carregar o dia no calendário",
      data: null,
    };
  }
}

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

    const inicio = new Date(year, month, 1);
    const fim = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const eventos = await prisma.evento.findMany({
      where: {
        utilizadorId: user.id,
        OR: [
          { dataInicio: { gte: inicio, lte: fim } },
          { dataFim: { gte: inicio, lte: fim } },
          { dataInicio: { lte: inicio }, dataFim: { gte: fim } },
        ],
      },
      include: {
        disciplina: true,
      },
      orderBy: { dataInicio: "asc" },
    });

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

    const disciplinas = await prisma.disciplina.findMany({
      where: { utilizadorId: user.id },
      select: {
        id: true,
        nome: true,
        cor: true,
      },
      orderBy: { nome: "asc" },
    });

    return {
      success: true,
      data: {
        eventos,
        avaliacoes,
        tarefas,
        disciplinas,
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

export async function createCalendarEventAction(input: {
  titulo: string;
  tipo: TipoEvento;
  dataInicio: Date;
  dataFim?: Date;
  disciplinaId?: string;
  diaInteiro?: boolean;
  notas?: string;
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

    if (!input.titulo.trim()) {
      return { success: false, error: "Título obrigatório", data: null };
    }

    if (input.dataFim && input.dataFim < input.dataInicio) {
      return { success: false, error: "Intervalo de datas inválido", data: null };
    }

    if (input.disciplinaId) {
      const disciplina = await prisma.disciplina.findUnique({
        where: { id: input.disciplinaId },
      });
      if (!disciplina || disciplina.utilizadorId !== user.id) {
        return { success: false, error: "Disciplina inválida", data: null };
      }
    }

    const evento = await prisma.evento.create({
      data: {
        utilizadorId: user.id,
        titulo: input.titulo.trim(),
        tipo: input.tipo,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim || null,
        diaInteiro: input.diaInteiro ?? false,
        disciplinaId: input.disciplinaId || null,
        notas: input.notas?.trim() || null,
      },
      include: {
        disciplina: true,
      },
    });

    return { success: true, data: evento };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return { success: false, error: "Erro ao criar evento", data: null };
  }
}

export async function updateCalendarEventAction(input: {
  eventoId: string;
  titulo: string;
  tipo: TipoEvento;
  dataInicio: Date;
  dataFim?: Date | null;
  disciplinaId?: string | null;
  diaInteiro?: boolean;
  notas?: string | null;
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

    const existente = await prisma.evento.findUnique({
      where: { id: input.eventoId },
    });

    if (!existente || existente.utilizadorId !== user.id) {
      return { success: false, error: "Evento não encontrado", data: null };
    }

    if (!input.titulo.trim()) {
      return { success: false, error: "Título obrigatório", data: null };
    }

    const dataFim = input.dataFim ?? null;
    if (dataFim && dataFim < input.dataInicio) {
      return { success: false, error: "Intervalo de datas inválido", data: null };
    }

    if (input.disciplinaId) {
      const disciplina = await prisma.disciplina.findUnique({
        where: { id: input.disciplinaId },
      });
      if (!disciplina || disciplina.utilizadorId !== user.id) {
        return { success: false, error: "Disciplina inválida", data: null };
      }
    }

    const evento = await prisma.evento.update({
      where: { id: input.eventoId },
      data: {
        titulo: input.titulo.trim(),
        tipo: input.tipo,
        dataInicio: input.dataInicio,
        dataFim,
        diaInteiro: input.diaInteiro ?? false,
        disciplinaId: input.disciplinaId || null,
        notas: input.notas?.trim() || null,
      },
      include: {
        disciplina: true,
      },
    });

    return { success: true, data: evento };
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return { success: false, error: "Erro ao atualizar evento", data: null };
  }
}

export async function deleteCalendarEventAction(eventoId: string) {
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

    const existente = await prisma.evento.findUnique({
      where: { id: eventoId },
    });

    if (!existente || existente.utilizadorId !== user.id) {
      return { success: false, error: "Evento não encontrado" };
    }

    await prisma.evento.delete({
      where: { id: eventoId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return { success: false, error: "Erro ao eliminar evento" };
  }
}
