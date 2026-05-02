import { NextResponse } from "next/server";

export async function POST() {
  // Tokens are stateless in the first mobile API version.
  // The mobile client should delete accessToken/refreshToken locally.
  return NextResponse.json({
    success: true,
    message: "Sessão terminada no dispositivo",
  });
}
