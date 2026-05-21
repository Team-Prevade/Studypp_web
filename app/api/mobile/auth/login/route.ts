import { NextRequest, NextResponse } from "next/server";
import { createMobileTokenPair } from "@/lib/mobile-auth";
import {
  authenticatePayloadWithPassword,
  normalizeAuthEmail,
  readPasswordCredential,
} from "@/lib/password-auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeAuthEmail(body.email);
    const password = readPasswordCredential(body);
    const deviceId = body.deviceId ? String(body.deviceId) : undefined;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email e password/senha sao obrigatorios" },
        { status: 400 },
      );
    }

    const user = await authenticatePayloadWithPassword(body);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Credenciais invalidas" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user,
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
