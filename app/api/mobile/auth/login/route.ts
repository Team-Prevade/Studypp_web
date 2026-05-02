import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createMobileTokenPair } from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const deviceId = body.deviceId ? String(body.deviceId) : undefined;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email e password são obrigatórios" }, { status: 400 });
    }

    const user = await prisma.utilizador.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        passwordHash: true,
        onboardingFeito: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 });
    }

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordsMatch) {
      return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 });
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
      tokens: createMobileTokenPair(user, deviceId),
      sync: {
        serverTime: new Date().toISOString(),
        requiresInitialBackup: false,
      },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json({ success: false, error: "Erro ao fazer login" }, { status: 500 });
  }
}
