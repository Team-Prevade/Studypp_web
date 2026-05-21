import { Prisma, TipoEvento } from "@prisma/client";
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

type MobileEventRecord = {
  localId?: unknown;
  serverId?: unknown;
  deletedAt?: unknown;
  metadata?: unknown;
  disciplinaServerId?: unknown;
  disciplinaNome?: unknown;
  titulo?: unknown;
  tipo?: unknown;
  dataInicio?: unknown;
  dataFim?: unknown;
  diaInteiro?: unknown;
  notas?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readMetadataCategory(value: unknown) {
  if (!isRecord(value)) return "";
  return readString(value.category).toLowerCase();
}

function isMobileEventRecord(value: unknown): value is MobileEventRecord {
  return isRecord(value);
}

async function resolveMobileDisciplinaId(
  tx: Prisma.TransactionClient,
  utilizadorId: string,
  record: MobileEventRecord,
) {
  const serverId = readString(record.disciplinaServerId);
  if (serverId) {
    const disciplina = await tx.disciplina.findFirst({
      where: { id: serverId, utilizadorId },
      select: { id: true },
    });
    if (disciplina) return disciplina.id;
  }

  const nome = readString(record.disciplinaNome);
  if (!nome) return null;

  const existing = await tx.disciplina.findUnique({
    where: {
      utilizadorId_nome: {
        utilizadorId,
        nome,
      },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const color = isRecord(record.metadata) && typeof record.metadata.color === "string"
    ? record.metadata.color
    : "#2563EB";

  const disciplina = await tx.disciplina.create({
    data: {
      utilizadorId,
      nome,
      cor: color,
    },
    select: { id: true },
  });

  return disciplina.id;
}

function classifyMobileEvent(record: MobileEventRecord) {
  const tipo = readString(record.tipo).toLowerCase();
  const category = readMetadataCategory(record.metadata);

  if (tipo === "task" || category === "tarefa") return "task";
  if (tipo === "reminder" || category === "lembrete") return "reminder";
  if (tipo === "exam" || category === "prova" || category === "teste") return "exam";
  return "event";
}

async function importMobileEvents(
  tx: Prisma.TransactionClient,
  utilizadorId: string,
  data: Record<string, unknown>,
) {
  const eventos = Array.isArray(data.eventos) ? data.eventos : [];
  const imported = { eventos: 0, tarefas: 0, lembretes: 0, skipped: 0 };

  for (const item of eventos) {
    if (!isMobileEventRecord(item)) {
      imported.skipped += 1;
      continue;
    }

    if (item.deletedAt) {
      imported.skipped += 1;
      continue;
    }

    const titulo = readString(item.titulo);
    const dataInicio = parseOptionalDate(item.dataInicio);
    if (!titulo || !dataInicio) {
      imported.skipped += 1;
      continue;
    }

    const dataFim = parseOptionalDate(item.dataFim);
    const notas = readString(item.notas) || null;
    const disciplinaId = await resolveMobileDisciplinaId(tx, utilizadorId, item);
    const kind = classifyMobileEvent(item);

    if (kind === "task") {
      const existing = await tx.tarefa.findFirst({
        where: { utilizadorId, titulo, prazo: dataInicio },
        select: { id: true },
      });
      if (existing) {
        imported.skipped += 1;
        continue;
      }

      await tx.tarefa.create({
        data: {
          utilizadorId,
          disciplinaId,
          titulo,
          descricao: notas,
          prazo: dataInicio,
        },
      });
      imported.tarefas += 1;
      continue;
    }

    if (kind === "reminder") {
      const existing = await tx.lembrete.findFirst({
        where: { utilizadorId, titulo, dataHora: dataInicio },
        select: { id: true },
      });
      if (existing) {
        imported.skipped += 1;
        continue;
      }

      await tx.lembrete.create({
        data: {
          utilizadorId,
          disciplinaId,
          titulo,
          dataHora: dataInicio,
          notas,
        },
      });
      imported.lembretes += 1;
      continue;
    }

    const tipoEvento = kind === "exam" ? TipoEvento.TESTE_EXAME : TipoEvento.EVENTO_PESSOAL;
    const existing = await tx.evento.findFirst({
      where: { utilizadorId, titulo, dataInicio, tipo: tipoEvento },
      select: { id: true },
    });
    if (existing) {
      imported.skipped += 1;
      continue;
    }

    await tx.evento.create({
      data: {
        utilizadorId,
        disciplinaId,
        titulo,
        tipo: tipoEvento,
        dataInicio,
        dataFim,
        diaInteiro: item.diaInteiro === true,
        notas,
      },
    });
    imported.eventos += 1;
  }

  return imported;
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

  const result = await prisma.$transaction(async (tx) => {
    const backup = await tx.mobileBackup.upsert({
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

    const imported = await importMobileEvents(tx, user.id, body.data as Record<string, unknown>);
    return { backup, imported };
  });

  return NextResponse.json({
    success: true,
    backup: {
      ...result.backup,
      idempotent: Boolean(existingBackup),
      receivedAt: result.backup.updatedAt.toISOString(),
    },
    imported: {
      ...result.imported,
      note: "Nesta fase, o backup materializa eventos, tarefas e lembretes do array data.eventos.",
    },
    sync: {
      serverTime: new Date().toISOString(),
      next: "bootstrap",
    },
  });
}
