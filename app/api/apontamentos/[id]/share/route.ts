import { NextRequest, NextResponse } from "next/server";
import {
  ensureShareForOwner,
  getOwnedShare,
  normalizeSharePayload,
} from "@/lib/apontamentos-share";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getOwnedShare(params.id);

  if (!result.user) {
    return NextResponse.json({ success: false, error: result.error }, { status: 401 });
  }

  if (result.error) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    share: result.share,
  });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ success: false, error: "JSON invalido" }, { status: 400 });
  }

  const base = await ensureShareForOwner(params.id);
  if (!base.user) {
    return NextResponse.json({ success: false, error: base.error }, { status: 401 });
  }

  if (!base.share) {
    return NextResponse.json({ success: false, error: base.error }, { status: 404 });
  }

  const data = normalizeSharePayload(body);
  const share = await prisma.apontamentoShare.update({
    where: { id: base.share.id },
    data,
    include: {
      participants: {
        include: {
          utilizador: { select: { id: true, nome: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ success: true, share });
}
