import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: false,
    error: "Endpoint de horario ainda nao implementado.",
  }, { status: 501 });
}
