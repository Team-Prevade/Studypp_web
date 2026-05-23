import prisma from "@/lib/prisma";

export type AssistantToolResult = {
  name: string;
  title: string;
  data: unknown;
};

function stripHtml(value?: string | null) {
  return (value ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function getAssistantUser(email: string) {
  return prisma.utilizador.findUnique({
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      anoEscolar: true,
      curso: true,
      onboardingFeito: true,
    },
  });
}

async function studentProfileTool(utilizadorId: string): Promise<AssistantToolResult> {
  const user = await prisma.utilizador.findUnique({
    where: { id: utilizadorId },
    select: {
      nome: true,
      anoEscolar: true,
      curso: true,
      disciplinas: {
        where: { ativo: true },
        orderBy: { ordem: "asc" },
        select: { nome: true, cor: true, professor: true, sala: true },
      },
    },
  });

  return {
    name: "student_profile",
    title: "Perfil académico",
    data: user,
  };
}

async function upcomingWorkTool(utilizadorId: string): Promise<AssistantToolResult> {
  const today = startOfToday();
  const inThirtyDays = addDays(today, 30);

  const [tarefas, eventos, lembretes] = await Promise.all([
    prisma.tarefa.findMany({
      where: {
        utilizadorId,
        status: { not: "CONCLUIDA" },
        OR: [{ prazo: null }, { prazo: { gte: today, lte: inThirtyDays } }],
      },
      orderBy: [{ prazo: "asc" }, { updatedAt: "desc" }],
      take: 12,
      select: {
        titulo: true,
        descricao: true,
        prazo: true,
        prioridade: true,
        status: true,
        progresso: true,
        disciplina: { select: { nome: true, cor: true } },
      },
    }),
    prisma.evento.findMany({
      where: {
        utilizadorId,
        dataInicio: { gte: today, lte: inThirtyDays },
      },
      orderBy: { dataInicio: "asc" },
      take: 12,
      select: {
        titulo: true,
        tipo: true,
        dataInicio: true,
        dataFim: true,
        notas: true,
        disciplina: { select: { nome: true, cor: true } },
      },
    }),
    prisma.lembrete.findMany({
      where: {
        utilizadorId,
        concluido: false,
        dataHora: { gte: today, lte: inThirtyDays },
      },
      orderBy: { dataHora: "asc" },
      take: 10,
      select: {
        titulo: true,
        dataHora: true,
        repetir: true,
        notas: true,
      },
    }),
  ]);

  return {
    name: "upcoming_work",
    title: "Prazos e agenda próximos",
    data: { tarefas, eventos, lembretes },
  };
}

async function gradesAndGoalsTool(utilizadorId: string): Promise<AssistantToolResult> {
  const [avaliacoes, objectivos] = await Promise.all([
    prisma.avaliacao.findMany({
      where: { utilizadorId },
      orderBy: { data: "desc" },
      take: 15,
      select: {
        nome: true,
        tipo: true,
        data: true,
        nota: true,
        peso: true,
        disciplina: { select: { nome: true, cor: true } },
      },
    }),
    prisma.objectivo.findMany({
      where: { utilizadorId, status: { not: "CONCLUIDO" } },
      orderBy: [{ prazo: "asc" }, { updatedAt: "desc" }],
      take: 10,
      select: {
        titulo: true,
        descricao: true,
        categoria: true,
        prazo: true,
        status: true,
        subTarefas: {
          orderBy: { ordem: "asc" },
          select: { titulo: true, concluida: true },
        },
      },
    }),
  ]);

  return {
    name: "grades_and_goals",
    title: "Notas e objectivos",
    data: { avaliacoes, objectivos },
  };
}

async function notesContextTool(utilizadorId: string): Promise<AssistantToolResult> {
  const apontamentos = await prisma.apontamento.findMany({
    where: { utilizadorId },
    orderBy: [{ fixado: "desc" }, { updatedAt: "desc" }],
    take: 8,
    select: {
      titulo: true,
      tipo: true,
      fixado: true,
      updatedAt: true,
      conteudo: true,
      disciplina: { select: { nome: true, cor: true } },
    },
  });

  return {
    name: "notes_context",
    title: "Apontamentos recentes",
    data: apontamentos.map((note) => ({
      ...note,
      conteudo: stripHtml(note.conteudo),
    })),
  };
}

export const chatbotTools = [
  {
    name: "student_profile",
    description: "Lê perfil académico, curso e disciplinas activas do estudante.",
  },
  {
    name: "upcoming_work",
    description: "Consulta tarefas, eventos e lembretes dos próximos 30 dias.",
  },
  {
    name: "grades_and_goals",
    description: "Consulta avaliações recentes e objectivos activos.",
  },
  {
    name: "notes_context",
    description: "Consulta apontamentos recentes e fixados para dar respostas contextualizadas.",
  },
];

export async function runAssistantTools(utilizadorId: string) {
  return Promise.all([
    studentProfileTool(utilizadorId),
    upcomingWorkTool(utilizadorId),
    gradesAndGoalsTool(utilizadorId),
    notesContextTool(utilizadorId),
  ]);
}
