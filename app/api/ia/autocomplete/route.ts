import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { aiProvider, generateAIText, isAIConfigured } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Nao autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { text?: unknown; intent?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const intent = typeof body?.intent === "string" ? body.intent.trim() : "continuar texto";

  if (!text) {
    return NextResponse.json({ success: false, error: "Texto obrigatorio" }, { status: 400 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json({
      success: true,
      provider: "fallback",
      suggestion: "com um exemplo breve e uma conclusao clara",
    });
  }

  const suggestion = await generateAIText({
    instructions:
      "Ajuda um estudante a completar apontamentos. Responde apenas com a proxima continuacao natural, em portugues, com 3 a 12 palavras, sem prefacio, aspas, markdown ou explicacoes.",
    prompt: `Intencao: ${intent}\n\nTexto actual:\n${text.slice(-4000)}`,
    maxOutputTokens: 80,
  });

  return NextResponse.json({ success: true, provider: aiProvider, suggestion });
}
