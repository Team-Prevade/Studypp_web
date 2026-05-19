import crypto from "node:crypto";
import { auth } from "@/auth";
import { createCollaborationToken, collaborationColor } from "@/lib/collaboration-auth";
import prisma from "@/lib/prisma";

type SharePermission = "READ" | "WRITE";
type ShareVisibility = "PRIVATE" | "PUBLIC";

export async function getCurrentUtilizador() {
  const session = await auth();
  if (!session?.user?.email) return null;

  return prisma.utilizador.findUnique({
    where: { email: session.user.email },
    select: { id: true, nome: true, email: true },
  });
}

export function createShareToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export async function getOwnedShare(apontamentoId: string) {
  const user = await getCurrentUtilizador();
  if (!user) return { user: null, share: null, error: "Nao autenticado" };

  const apontamento = await prisma.apontamento.findFirst({
    where: { id: apontamentoId, utilizadorId: user.id },
    select: {
      id: true,
      titulo: true,
      share: {
        include: {
          participants: {
            include: {
              utilizador: { select: { id: true, nome: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!apontamento) return { user, share: null, error: "Apontamento nao encontrado" };

  return {
    user,
    share: apontamento.share,
    apontamento,
    error: null,
  };
}

export async function ensureShareForOwner(apontamentoId: string) {
  const owned = await getOwnedShare(apontamentoId);
  if (!owned.user || !owned.apontamento) return { ...owned, share: null };
  if (owned.share) return owned;

  const share = await prisma.apontamentoShare.create({
    data: {
      apontamentoId,
      token: createShareToken(),
      enabled: true,
      visibility: "PRIVATE",
      publicPermission: "READ",
    },
    include: {
      participants: {
        include: {
          utilizador: { select: { id: true, nome: true, email: true } },
        },
      },
    },
  });

  return { ...owned, share };
}

export async function getSharedApontamentoByToken(token: string, guestName?: string) {
  const share = await prisma.apontamentoShare.findUnique({
    where: { token },
    include: {
      apontamento: {
        include: {
          disciplina: { select: { id: true, nome: true, cor: true } },
          utilizador: { select: { id: true, nome: true, email: true } },
        },
      },
      participants: {
        include: {
          utilizador: { select: { id: true, nome: true, email: true } },
        },
      },
    },
  });

  if (!share?.enabled) {
    return { success: false as const, error: "Link indisponivel" };
  }

  const currentUser = await getCurrentUtilizador();
  const isOwner = currentUser?.id === share.apontamento.utilizadorId;
  const participant = currentUser
    ? share.participants.find((item) => item.utilizadorId === currentUser.id)
    : null;
  const isPublic = share.visibility === "PUBLIC";

  if (!isPublic && !isOwner && !participant) {
    return { success: false as const, error: "Sem permissao para aceder a este apontamento" };
  }

  const permission: SharePermission = isOwner
    ? "WRITE"
    : isPublic
      ? share.publicPermission
      : participant?.permission ?? "READ";
  const name = currentUser?.nome || guestName?.trim() || "Convidado";
  const color = collaborationColor(currentUser?.email || name);

  return {
    success: true as const,
    data: {
      share,
      apontamento: share.apontamento,
      user: currentUser,
      permission,
      collaborationToken: createCollaborationToken({
        noteId: share.apontamento.id,
        permission,
        name,
        color,
        guest: !currentUser,
      }),
      collaborator: {
        name,
        color,
        guest: !currentUser,
      },
    },
  };
}

export function normalizeSharePayload(input: Record<string, unknown>) {
  const visibility = input.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE";
  const publicPermission = input.publicPermission === "WRITE" ? "WRITE" : "READ";

  return {
    enabled: Boolean(input.enabled),
    visibility: visibility as ShareVisibility,
    publicPermission: publicPermission as SharePermission,
  };
}
