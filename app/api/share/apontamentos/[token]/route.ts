import { NextRequest, NextResponse } from "next/server";
import { getSharedApontamentoByToken } from "@/lib/apontamentos-share";
import prisma from "@/lib/prisma";

const MAX_TITLE_LENGTH = 160;
const MAX_CONTENT_LENGTH = 95 * 1024 * 1024;

export async function PATCH(request: NextRequest, { params }: { params: { token: string } }) {
  const access = await getSharedApontamentoByToken(params.token);
  if (!access.success) {
    return NextResponse.json({ success: false, error: access.error }, { status: 403 });
  }

  if (access.data.permission !== "WRITE") {
    return NextResponse.json({ success: false, error: "Sem permissao de edicao" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { titulo?: string; conteudo?: string }
    | null;

  if (!body) {
    return NextResponse.json({ success: false, error: "JSON invalido" }, { status: 400 });
  }

  const conteudo = body.conteudo ?? "";
  if (Buffer.byteLength(conteudo, "utf8") > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ success: false, error: "Conteudo demasiado grande" }, { status: 413 });
  }

  const apontamento = await prisma.apontamento.update({
    where: { id: access.data.apontamento.id },
    data: {
      titulo: (body.titulo?.trim() || "Sem titulo").slice(0, MAX_TITLE_LENGTH),
      conteudo,
    },
    select: {
      id: true,
      titulo: true,
      conteudo: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, apontamento });
}
