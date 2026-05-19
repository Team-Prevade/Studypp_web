import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: false,
    error: "Endpoint de chat IA ainda nao implementado.",
  }, { status: 501 });
}
