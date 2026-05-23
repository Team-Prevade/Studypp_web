import prisma from "@/lib/prisma";

export async function getAssistantUserByEmail(email?: string | null) {
  if (!email) return null;
  return prisma.utilizador.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
}

export function buildConversationTitle(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean) return "Nova conversa";
  return clean.length > 44 ? `${clean.slice(0, 44)}...` : clean;
}

export async function assertConversationOwner(conversationId: string, utilizadorId: string) {
  return prisma.conversaIA.findFirst({
    where: { id: conversationId, utilizadorId },
    select: { id: true, titulo: true },
  });
}

export function serializeAssistantMessage(message: {
  id: string;
  role: string;
  content: string;
  actions: unknown;
  createdAt: Date;
}) {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    actions: Array.isArray(message.actions) ? message.actions : [],
    createdAt: message.createdAt.toISOString(),
  };
}
