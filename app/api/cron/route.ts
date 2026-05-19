import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Cron endpoint ativo. Nenhum job configurado ainda.",
  });
}
