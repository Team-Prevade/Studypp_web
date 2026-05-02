import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email obrigatório" }, { status: 400 });
    }

    const user = await prisma.utilizador.findUnique({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json({ success: true, exists: Boolean(user) });
  } catch {
    return NextResponse.json({ success: false, error: "Pedido inválido" }, { status: 400 });
  }
}
