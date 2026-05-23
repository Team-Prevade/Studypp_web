import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildConversationTitle, getAssistantUserByEmail } from "@/lib/assistant-history";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const user = await getAssistantUserByEmail(session?.user?.email);
  if (!user) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  const conversations = await prisma.conversaIA.findMany({
    where: { utilizadorId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      titulo: true,
      updatedAt: true,
      createdAt: true,
      _count: { select: { mensagens: true } },
      mensagens: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.titulo,
      preview: conversation.mensagens[0]?.content || "",
      messageCount: conversation._count.mensagens,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const user = await getAssistantUserByEmail(session?.user?.email);
  if (!user) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
  const title = typeof body?.title === "string" ? body.title : "";

  const conversation = await prisma.conversaIA.create({
    data: {
      utilizadorId: user.id,
      titulo: buildConversationTitle(title),
    },
  });

  return NextResponse.json({
    success: true,
    conversation: {
      id: conversation.id,
      title: conversation.titulo,
      preview: "",
      messageCount: 0,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    },
  });
}
