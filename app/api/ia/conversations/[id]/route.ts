import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  assertConversationOwner,
  getAssistantUserByEmail,
  serializeAssistantMessage,
} from "@/lib/assistant-history";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const user = await getAssistantUserByEmail(session?.user?.email);
  if (!user) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  const conversation = await prisma.conversaIA.findFirst({
    where: { id: params.id, utilizadorId: user.id },
    select: {
      id: true,
      titulo: true,
      createdAt: true,
      updatedAt: true,
      mensagens: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          actions: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ success: false, error: "Conversa nao encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    conversation: {
      id: conversation.id,
      title: conversation.titulo,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.mensagens.map(serializeAssistantMessage),
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const user = await getAssistantUserByEmail(session?.user?.email);
  if (!user) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  const conversation = await assertConversationOwner(params.id, user.id);
  if (!conversation) {
    return NextResponse.json({ success: false, error: "Conversa nao encontrada" }, { status: 404 });
  }

  await prisma.conversaIA.delete({ where: { id: conversation.id } });
  return NextResponse.json({ success: true });
}
