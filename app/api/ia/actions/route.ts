import { NextRequest, NextResponse } from "next/server";
import { PrioridadeTarefa, RepetirLembrete, TipoEvento } from "@prisma/client";
import { auth } from "@/auth";
import type { AssistantActionProposal, AssistantActionType } from "@/lib/assistant-action-types";
import prisma from "@/lib/prisma";

const priorityValues = Object.values(PrioridadeTarefa);
const eventTypeValues = Object.values(TipoEvento);
const repeatValues = Object.values(RepetirLembrete);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const clean = text(value);
  return clean || null;
}

function parseDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeColor(value: unknown) {
  const color = text(value);
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#2563EB";
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  return prisma.utilizador.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });
}

async function resolveDisciplinaId(utilizadorId: string, payload: Record<string, unknown>) {
  const disciplinaId = text(payload.disciplinaId);
  if (disciplinaId) {
    const disciplina = await prisma.disciplina.findFirst({
      where: { id: disciplinaId, utilizadorId, ativo: true },
      select: { id: true },
    });
    return disciplina?.id ?? null;
  }

  const disciplinaNome = text(payload.disciplinaNome);
  if (!disciplinaNome) return null;

  const disciplinas = await prisma.disciplina.findMany({
    where: { utilizadorId, ativo: true },
    select: { id: true, nome: true },
  });

  const normalized = disciplinaNome.toLowerCase();
  return (
    disciplinas.find((disciplina) => disciplina.nome.toLowerCase() === normalized)?.id ??
    disciplinas.find((disciplina) => disciplina.nome.toLowerCase().includes(normalized))?.id ??
    null
  );
}

function normalizeActionType(value: unknown): AssistantActionType | null {
  if (
    value === "create_task" ||
    value === "create_event" ||
    value === "create_reminder" ||
    value === "create_discipline"
  ) {
    return value;
  }
  return null;
}

async function createTask(utilizadorId: string, payload: Record<string, unknown>) {
  const titulo = text(payload.titulo);
  if (!titulo) return { success: false, error: "Titulo da tarefa obrigatorio" };

  const priority = text(payload.prioridade).toUpperCase() as PrioridadeTarefa;
  const disciplinaId = await resolveDisciplinaId(utilizadorId, payload);

  const tarefa = await prisma.tarefa.create({
    data: {
      utilizadorId,
      titulo,
      descricao: optionalText(payload.descricao),
      prazo: parseDate(payload.prazo),
      prioridade: priorityValues.includes(priority) ? priority : PrioridadeTarefa.MEDIA,
      disciplinaId,
    },
    include: { disciplina: { select: { id: true, nome: true, cor: true } } },
  });

  return { success: true, data: tarefa, message: "Tarefa criada." };
}

async function createEvent(utilizadorId: string, payload: Record<string, unknown>) {
  const titulo = text(payload.titulo);
  if (!titulo) return { success: false, error: "Titulo do evento obrigatorio" };

  const dataInicio = parseDate(payload.dataInicio);
  if (!dataInicio) return { success: false, error: "Data de inicio do evento obrigatoria" };

  const dataFim = parseDate(payload.dataFim);
  if (dataFim && dataFim < dataInicio) {
    return { success: false, error: "Data de fim invalida" };
  }

  const tipo = text(payload.tipo).toUpperCase() as TipoEvento;
  const disciplinaId = await resolveDisciplinaId(utilizadorId, payload);

  const evento = await prisma.evento.create({
    data: {
      utilizadorId,
      titulo,
      tipo: eventTypeValues.includes(tipo) ? tipo : TipoEvento.EVENTO_PESSOAL,
      dataInicio,
      dataFim,
      diaInteiro: payload.diaInteiro === true,
      notas: optionalText(payload.notas),
      disciplinaId,
    },
    include: { disciplina: { select: { id: true, nome: true, cor: true } } },
  });

  return { success: true, data: evento, message: "Evento criado." };
}

async function createReminder(utilizadorId: string, payload: Record<string, unknown>) {
  const titulo = text(payload.titulo);
  if (!titulo) return { success: false, error: "Titulo do lembrete obrigatorio" };

  const dataHora = parseDate(payload.dataHora);
  if (!dataHora) return { success: false, error: "Data e hora do lembrete obrigatorias" };

  const repetir = text(payload.repetir).toUpperCase() as RepetirLembrete;
  const disciplinaId = await resolveDisciplinaId(utilizadorId, payload);

  const lembrete = await prisma.lembrete.create({
    data: {
      utilizadorId,
      titulo,
      dataHora,
      repetir: repeatValues.includes(repetir) ? repetir : RepetirLembrete.NUNCA,
      notas: optionalText(payload.notas),
      disciplinaId,
    },
  });

  return { success: true, data: lembrete, message: "Lembrete criado." };
}

async function createDiscipline(utilizadorId: string, payload: Record<string, unknown>) {
  const nome = text(payload.nome);
  if (!nome) return { success: false, error: "Nome da disciplina obrigatorio" };

  const disciplina = await prisma.disciplina.create({
    data: {
      utilizadorId,
      nome,
      professor: optionalText(payload.professor),
      sala: optionalText(payload.sala),
      notas: optionalText(payload.notas),
      cor: normalizeColor(payload.cor),
      ativo: true,
    },
  });

  return { success: true, data: disciplina, message: "Disciplina criada." };
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<AssistantActionProposal> | null;
  const type = normalizeActionType(body?.type);
  const payload = body?.payload && typeof body.payload === "object"
    ? (body.payload as Record<string, unknown>)
    : {};

  if (!type) {
    return NextResponse.json({ success: false, error: "Acao invalida" }, { status: 400 });
  }

  try {
    const result =
      type === "create_task"
        ? await createTask(user.id, payload)
        : type === "create_event"
          ? await createEvent(user.id, payload)
          : type === "create_reminder"
            ? await createReminder(user.id, payload)
            : await createDiscipline(user.id, payload);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error("Assistant action error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ success: false, error: "Ja existe um registo semelhante." }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Nao foi possivel executar a acao." }, { status: 500 });
  }
}
