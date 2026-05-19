import { NextRequest, NextResponse } from "next/server";
import { getOwnedShare } from "@/lib/apontamentos-share";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; participantId: string } },
) {
  const base = await getOwnedShare(params.id);
  if (!base.user) {
    return NextResponse.json({ success: false, error: base.error }, { status: 401 });
  }

  if (!base.share) {
    return NextResponse.json({ success: false, error: base.error }, { status: 404 });
  }

  await prisma.apontamentoShareParticipant.deleteMany({
    where: {
      id: params.participantId,
      shareId: base.share.id,
    },
  });

  return NextResponse.json({ success: true });
}
