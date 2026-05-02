import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createMobileTokenPair } from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const deviceId = body.deviceId ? String(body.deviceId) : undefined;

    if (!nome || !email || !password) {
      return NextResponse.json({ success: false, error: "Nome, email e password são obrigatórios" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "A password deve ter pelo menos 8 caracteres" }, { status: 400 });
    }

    const existingUser = await prisma.utilizador.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Este email já está registado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.utilizador.create({
      data: {
        nome,
        email,
        passwordHash,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        onboardingFeito: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user,
        tokens: createMobileTokenPair(user, deviceId),
        sync: {
          serverTime: new Date().toISOString(),
          requiresInitialBackup: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Mobile register error:", error);
    return NextResponse.json({ success: false, error: "Erro ao criar conta" }, { status: 500 });
  }
}
