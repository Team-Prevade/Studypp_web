import { NextRequest, NextResponse } from "next/server";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  const { user, error } = await getMobileUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ success: false, error }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user,
    sync: {
      serverTime: new Date().toISOString(),
      requiresInitialBackup: false,
      schemaVersion: 1,
    },
  });
}
