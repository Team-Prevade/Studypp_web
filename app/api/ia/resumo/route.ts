import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { aiProvider, generateAIText, isAIConfigured } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ success: false, error: "Texto obrigatorio" }, { status: 400 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json({
      success: true,
      provider: "fallback",
      summary: text.replace(/\s+/g, " ").slice(0, 500),
    });
  }

  const summary = await generateAIText({
    instructions: "Resume o texto em portugues para um estudante. Usa bullets curtos e destaca conceitos-chave.",
    prompt: text.slice(0, 12000),
    maxOutputTokens: 600,
  });

  return NextResponse.json({ success: true, provider: aiProvider, summary });
}
