import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createMobileTokenPair, verifyMobileToken } from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = String(body.refreshToken || "");

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: "Refresh token obrigatório" }, { status: 400 });
    }

    const payload = verifyMobileToken(refreshToken, "refresh");
    if (!payload) {
      return NextResponse.json({ success: false, error: "Refresh token inválido ou expirado" }, { status: 401 });
    }

    const user = await prisma.utilizador.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        email: true,
        onboardingFeito: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Utilizador não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      tokens: createMobileTokenPair(user, payload.deviceId),
      sync: {
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Mobile refresh error:", error);
    return NextResponse.json({ success: false, error: "Erro ao renovar sessão" }, { status: 500 });
  }
}
