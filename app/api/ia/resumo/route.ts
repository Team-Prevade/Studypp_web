import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: false,
    error: "Endpoint de resumo IA ainda nao implementado.",
  }, { status: 501 });
}
