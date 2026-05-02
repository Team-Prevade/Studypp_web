import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";

const MAX_BACKUP_BYTES = 15 * 1024 * 1024;

const COLLECTION_KEYS = [
  "disciplinas",
  "aulas",
  "tarefas",
  "eventos",
  "avaliacoes",
  "notas",
  "apontamentos",
  "objectivos",
  "lembretes",
  "sessoesEstudo",
] as const;

type BackupPayload = {
  deviceId?: unknown;
  backupId?: unknown;
  clientVersion?: unknown;
  schemaVersion?: unknown;
  createdAt?: unknown;
  data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countCollections(data: Record<string, unknown>) {
  return COLLECTION_KEYS.reduce<Record<string, number>>((counts, key) => {
    counts[key] = Array.isArray(data[key]) ? data[key].length : 0;
    return counts;
  }, {});
}

export async function POST(request: NextRequest) {
  const { user, error } = await getMobileUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ success: false, error }, { status: 401 });
  }

  const rawBody = await request.text();
  const bodySize = Buffer.byteLength(rawBody, "utf8");

  if (bodySize > MAX_BACKUP_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: "Backup demasiado grande",
        limitBytes: MAX_BACKUP_BYTES,
      },
      { status: 413 },
    );
  }

  let body: BackupPayload;
  try {
    body = JSON.parse(rawBody) as BackupPayload;
  } catch {
    return NextResponse.json({ success: false, error: "JSON invalido" }, { status: 400 });
  }

  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  const backupId = typeof body.backupId === "string" ? body.backupId.trim() : "";
  const clientVersion = typeof body.clientVersion === "string" ? body.clientVersion.trim() : null;
  const schemaVersion = Number(body.schemaVersion);

  if (!deviceId) {
    return NextResponse.json({ success: false, error: "deviceId e obrigatorio" }, { status: 400 });
  }

  if (!backupId) {
    return NextResponse.json({ success: false, error: "backupId e obrigatorio" }, { status: 400 });
  }

  if (!Number.isInteger(schemaVersion) || schemaVersion <= 0) {
    return NextResponse.json(
      { success: false, error: "schemaVersion deve ser um inteiro positivo" },
      { status: 400 },
    );
  }

  if (!isRecord(body.data)) {
    return NextResponse.json(
      { success: false, error: "data deve ser um objecto JSON" },
      { status: 400 },
    );
  }

  const counts = countCollections(body.data);
  const clientCreatedAt = parseOptionalDate(body.createdAt);

  const existingBackup = await prisma.mobileBackup.findUnique({
    where: {
      utilizadorId_backupId: {
        utilizadorId: user.id,
        backupId,
      },
    },
    select: { id: true },
  });

  const backup = await prisma.mobileBackup.upsert({
    where: {
      utilizadorId_backupId: {
        utilizadorId: user.id,
        backupId,
      },
    },
    create: {
      utilizadorId: user.id,
      deviceId,
      backupId,
      clientVersion,
      schemaVersion,
      clientCreatedAt,
      payload: body.data as Prisma.InputJsonValue,
      counts: counts as Prisma.InputJsonValue,
    },
    update: {
      deviceId,
      clientVersion,
      schemaVersion,
      clientCreatedAt,
      payload: body.data as Prisma.InputJsonValue,
      counts: counts as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      backupId: true,
      deviceId: true,
      clientVersion: true,
      schemaVersion: true,
      counts: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    backup: {
      ...backup,
      idempotent: Boolean(existingBackup),
      receivedAt: backup.updatedAt.toISOString(),
    },
    sync: {
      serverTime: new Date().toISOString(),
      next: "bootstrap",
    },
  });
}
