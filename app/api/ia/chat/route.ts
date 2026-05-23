import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { aiProvider, generateAIText, isAIConfigured } from "@/lib/ai";
import type { AssistantActionProposal, AssistantStructuredResponse } from "@/lib/assistant-action-types";
import { assertConversationOwner, buildConversationTitle } from "@/lib/assistant-history";
import { getAssistantUser, runAssistantTools } from "@/lib/chatbot-tools";
import prisma from "@/lib/prisma";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatPayload = {
  message?: unknown;
  messages?: unknown;
  conversationId?: unknown;
};

const SYSTEM_INSTRUCTIONS = `
Tu es o Assistente Study++, um copiloto academico para estudantes.
Responde sempre em portugues claro, directo e cuidadoso.
Usa apenas o contexto fornecido pelas tools do sistema; quando algo nao estiver no contexto, diz isso.
Podes propor acoes de criacao, mas nunca digas que ja criaste algo. A app mostra um card de confirmacao antes de gravar.
Prioriza proximos prazos, foco de estudo, tarefas atrasadas, avaliacoes e apontamentos recentes.
Quando sugerires um plano, torna-o pequeno e accionavel.
Quando o estudante pedir para criar uma tarefa, evento, lembrete ou disciplina, devolve uma proposta em actions.
Responde exclusivamente em JSON valido, sem markdown:
{
  "message": "resposta curta para o estudante",
  "actions": [
    {
      "type": "create_task|create_event|create_reminder|create_discipline",
      "title": "titulo curto",
      "summary": "o que sera criado",
      "payload": {}
    }
  ]
}
Payloads aceites:
create_task: { "titulo": string, "descricao"?: string, "prazo"?: string ISO, "prioridade"?: "ALTA"|"MEDIA"|"BAIXA", "disciplinaNome"?: string }
create_event: { "titulo": string, "tipo"?: "TESTE_EXAME"|"ENTREGA_TRABALHO"|"EVENTO_PESSOAL"|"FERIADO", "dataInicio": string ISO, "dataFim"?: string ISO, "diaInteiro"?: boolean, "notas"?: string, "disciplinaNome"?: string }
create_reminder: { "titulo": string, "dataHora": string ISO, "repetir"?: "NUNCA"|"DIARIO"|"SEMANAL", "notas"?: string, "disciplinaNome"?: string }
create_discipline: { "nome": string, "professor"?: string, "sala"?: string, "notas"?: string, "cor"?: string }
`.trim();

function normalizeMessages(value: unknown, fallbackMessage: unknown): ChatMessage[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const role = record.role === "assistant" ? "assistant" : "user";
        const content = typeof record.content === "string" ? record.content.trim() : "";
        return content ? { role, content } : null;
      })
      .filter((item): item is ChatMessage => Boolean(item))
      .slice(-8);
  }

  const message = typeof fallbackMessage === "string" ? fallbackMessage.trim() : "";
  return message ? [{ role: "user", content: message }] : [];
}

function buildPrompt(messages: ChatMessage[], context: unknown) {
  return [
    `Data actual do sistema: ${new Date().toISOString()}.`,
    "Interpreta datas relativas a partir desta data.",
    "",
    "Contexto recolhido pelas tools:",
    JSON.stringify(context, null, 2),
    "",
    "Conversa recente:",
    messages.map((message) => `${message.role}: ${message.content}`).join("\n"),
    "",
    "Responde ao ultimo pedido do estudante.",
  ].join("\n");
}

function actionId() {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeAction(value: unknown): AssistantActionProposal | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const type = record.type;
  if (
    type !== "create_task" &&
    type !== "create_event" &&
    type !== "create_reminder" &&
    type !== "create_discipline"
  ) {
    return null;
  }

  const payload = record.payload && typeof record.payload === "object"
    ? (record.payload as Record<string, unknown>)
    : {};

  return {
    id: typeof record.id === "string" && record.id ? record.id : actionId(),
    type,
    title: typeof record.title === "string" && record.title.trim() ? record.title.trim() : "Acao sugerida",
    summary: typeof record.summary === "string" && record.summary.trim()
      ? record.summary.trim()
      : "Confirma para executar esta acao.",
    payload,
  };
}

function parseStructuredResponse(raw: string): AssistantStructuredResponse {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const candidate = firstBrace >= 0 && lastBrace > firstBrace
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned;

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions.map(normalizeAction).filter((item): item is AssistantActionProposal => Boolean(item))
      : [];

    return {
      message: typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : "Preparei uma proposta. Confirma antes de gravar.",
      actions,
    };
  } catch {
    return { message: raw.trim(), actions: [] };
  }
}

function buildFallbackActions(messages: ChatMessage[]): AssistantActionProposal[] {
  const last = messages.at(-1)?.content.trim() || "";
  const lower = last.toLowerCase();
  if (!/\b(cria|criar|adiciona|adicionar|marca|marcar|agenda|agendar)\b/.test(lower)) return [];

  if (/\bdisciplina\b/.test(lower)) {
    const name = last.match(/disciplina\s+(?:de\s+)?(.+)$/i)?.[1]?.trim() || "Nova disciplina";
    return [{
      id: actionId(),
      type: "create_discipline",
      title: "Criar disciplina",
      summary: `Criar a disciplina "${name}".`,
      payload: { nome: name },
    }];
  }

  if (/\b(lembrete|lembra-me|lembrar)\b/.test(lower)) {
    return [{
      id: actionId(),
      type: "create_reminder",
      title: "Criar lembrete",
      summary: "Criar um lembrete com os dados identificados. Ajusta a data se necessario antes de confirmar.",
      payload: { titulo: last.replace(/^cria(r)?|^adiciona(r)?/i, "").trim() || "Novo lembrete" },
    }];
  }

  if (/\b(evento|teste|prova|exame|calendario|calendário)\b/.test(lower)) {
    return [{
      id: actionId(),
      type: "create_event",
      title: "Criar evento",
      summary: "Criar um evento no calendario. Confirma a data antes de gravar.",
      payload: {
        titulo: last.replace(/^cria(r)?|^adiciona(r)?|^agenda(r)?/i, "").trim() || "Novo evento",
        tipo: /\b(teste|prova|exame)\b/.test(lower) ? "TESTE_EXAME" : "EVENTO_PESSOAL",
      },
    }];
  }

  return [{
    id: actionId(),
    type: "create_task",
    title: "Criar tarefa",
    summary: "Criar uma tarefa pendente. Confirma os dados antes de gravar.",
    payload: { titulo: last.replace(/^cria(r)?|^adiciona(r)?/i, "").trim() || "Nova tarefa" },
  }];
}

function buildFallbackAnswer(messages: ChatMessage[], context: Array<{ name: string; data: any }>) {
  const lastMessage = messages.at(-1)?.content || "Como posso estudar melhor?";
  const upcoming = context.find((tool) => tool.name === "upcoming_work")?.data;
  const tasks = Array.isArray(upcoming?.tarefas) ? upcoming.tarefas.length : 0;
  const events = Array.isArray(upcoming?.eventos) ? upcoming.eventos.length : 0;
  const reminders = Array.isArray(upcoming?.lembretes) ? upcoming.lembretes.length : 0;

  return [
    "Ainda nao tenho uma chave de IA configurada no servidor, mas ja consigo ler o teu contexto academico.",
    "",
    `Pedido recebido: "${lastMessage}"`,
    "",
    `Nos proximos 30 dias encontrei ${tasks} tarefa(s), ${events} evento(s) e ${reminders} lembrete(s).`,
    "Para activar respostas inteligentes completas, define `GEMINI_API_KEY` no ambiente do servidor.",
  ].join("\n");
}

async function ensureConversation(input: {
  conversationId?: unknown;
  utilizadorId: string;
  firstMessage: string;
}) {
  const conversationId = typeof input.conversationId === "string" ? input.conversationId.trim() : "";
  if (conversationId) {
    const existing = await assertConversationOwner(conversationId, input.utilizadorId);
    if (existing) return existing;
  }

  return prisma.conversaIA.create({
    data: {
      utilizadorId: input.utilizadorId,
      titulo: buildConversationTitle(input.firstMessage),
    },
    select: { id: true, titulo: true },
  });
}

async function persistChatTurn(input: {
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  actions: AssistantActionProposal[];
}) {
  await prisma.$transaction([
    prisma.mensagemIA.create({
      data: {
        conversaId: input.conversationId,
        role: "user",
        content: input.userMessage,
      },
    }),
    prisma.mensagemIA.create({
      data: {
        conversaId: input.conversationId,
        role: "assistant",
        content: input.assistantMessage,
        actions: input.actions as any,
      },
    }),
    prisma.conversaIA.update({
      where: { id: input.conversationId },
      data: {},
    }),
  ]);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  let payload: ChatPayload;
  try {
    payload = (await request.json()) as ChatPayload;
  } catch {
    return NextResponse.json({ success: false, error: "JSON invalido" }, { status: 400 });
  }

  const messages = normalizeMessages(payload.messages, payload.message);
  if (messages.length === 0) {
    return NextResponse.json({ success: false, error: "Mensagem obrigatoria" }, { status: 400 });
  }
  const lastUserMessage = messages.at(-1)?.content || "";

  const user = await getAssistantUser(session.user.email);
  if (!user) {
    return NextResponse.json({ success: false, error: "Utilizador nao encontrado" }, { status: 404 });
  }

  const conversation = await ensureConversation({
    conversationId: payload.conversationId,
    utilizadorId: user.id,
    firstMessage: lastUserMessage,
  });
  const tools = await runAssistantTools(user.id);

  if (!isAIConfigured()) {
    const actions = buildFallbackActions(messages);
    const message = actions.length
      ? "Ainda estou sem chave de IA configurada, mas preparei uma proposta simples para confirmares."
      : buildFallbackAnswer(messages, tools);

    await persistChatTurn({
      conversationId: conversation.id,
      userMessage: lastUserMessage,
      assistantMessage: message,
      actions,
    });

    return NextResponse.json({
      success: true,
      provider: "fallback",
      conversationId: conversation.id,
      conversationTitle: conversation.titulo,
      message,
      actions,
      tools,
    });
  }

  try {
    const answer = await generateAIText({
      instructions: SYSTEM_INSTRUCTIONS,
      prompt: buildPrompt(messages, tools),
    });
    const structured = parseStructuredResponse(answer);
    await persistChatTurn({
      conversationId: conversation.id,
      userMessage: lastUserMessage,
      assistantMessage: structured.message,
      actions: structured.actions,
    });

    return NextResponse.json({
      success: true,
      provider: aiProvider,
      conversationId: conversation.id,
      conversationTitle: conversation.titulo,
      message: structured.message,
      actions: structured.actions,
      tools,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Nao foi possivel gerar resposta de IA neste momento.",
      },
      { status: 502 },
    );
  }
}
