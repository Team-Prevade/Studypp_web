import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  const user = await prisma.utilizador.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "Utilizador nao encontrado" }, { status: 404 });
  }

  const apontamento = await prisma.apontamento.findFirst({
    where: {
      id: params.id,
      OR: [
        { utilizadorId: user.id },
        {
          share: {
            participants: {
              some: { utilizadorId: user.id },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      titulo: true,
      conteudo: true,
      updatedAt: true,
    },
  });

  if (!apontamento) {
    return NextResponse.json({ success: false, error: "Apontamento nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true, apontamento });
}
