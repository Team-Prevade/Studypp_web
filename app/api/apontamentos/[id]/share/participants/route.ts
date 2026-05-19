import { NextRequest, NextResponse } from "next/server";
import { ensureShareForOwner } from "@/lib/apontamentos-share";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; permission?: "READ" | "WRITE" }
    | null;

  if (!body?.email) {
    return NextResponse.json({ success: false, error: "Email obrigatorio" }, { status: 400 });
  }

  const base = await ensureShareForOwner(params.id);
  if (!base.user) {
    return NextResponse.json({ success: false, error: base.error }, { status: 401 });
  }

  if (!base.share) {
    return NextResponse.json({ success: false, error: base.error }, { status: 404 });
  }

  const participant = await prisma.utilizador.findUnique({
    where: { email: body.email.trim().toLowerCase() },
    select: { id: true, nome: true, email: true },
  });

  if (!participant) {
    return NextResponse.json({ success: false, error: "Utilizador nao encontrado" }, { status: 404 });
  }

  if (participant.id === base.user.id) {
    return NextResponse.json({ success: false, error: "O dono ja tem acesso total" }, { status: 400 });
  }

  const shareParticipant = await prisma.apontamentoShareParticipant.upsert({
    where: {
      shareId_utilizadorId: {
        shareId: base.share.id,
        utilizadorId: participant.id,
      },
    },
    create: {
      shareId: base.share.id,
      utilizadorId: participant.id,
      permission: body.permission === "WRITE" ? "WRITE" : "READ",
    },
    update: {
      permission: body.permission === "WRITE" ? "WRITE" : "READ",
    },
    include: {
      utilizador: { select: { id: true, nome: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, participant: shareParticipant });
}
