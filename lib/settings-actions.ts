"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export type SettingsData = {
  modoAppearance: string;
  corAcento: string;
  primeiroDiaSemana: string;
  mostrarFimSemana: boolean;
  duracaoTarefaPadrao: number;
  anoLectivoInicio: string;
  anoLectivoFim: string;
  notificacoes: {
    notifTarefasAtivo: boolean;
    notifTarefasAntecedencia: number;
    notifTarefasAtrasadas: boolean;
    notifEstudoInicio: boolean;
    notifEstudoFimPausa: boolean;
    notifEstudoFimSessao: boolean;
    notifObjectivosAtivo: boolean;
    notifObjectivosDias: number;
    notifLembretesAtivo: boolean;
    browserNotif: boolean;
    emailNotif: boolean;
    emailNotifAddress: string;
  };
};

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return { user: null, error: "Não autenticado" };
  }

  const user = await prisma.utilizador.findUnique({
    where: { email: session.user.email },
    include: { preferenciasNotif: true },
  });

  if (!user) {
    return { user: null, error: "Utilizador não encontrado" };
  }

  return { user, error: null };
}

function toDateOrNull(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeSettings(user: any): SettingsData {
  const prefs = user.preferenciasNotif;

  return {
    modoAppearance: user.modoAppearance || "system",
    corAcento: user.corAcento || "#2563EB",
    primeiroDiaSemana: user.primeiroDiaSemana || "SEGUNDA",
    mostrarFimSemana: user.mostrarFimSemana ?? false,
    duracaoTarefaPadrao: user.duracaoTarefaPadrao ?? 60,
    anoLectivoInicio: user.anoLectivoInicio ? new Date(user.anoLectivoInicio).toISOString().slice(0, 10) : "",
    anoLectivoFim: user.anoLectivoFim ? new Date(user.anoLectivoFim).toISOString().slice(0, 10) : "",
    notificacoes: {
      notifTarefasAtivo: prefs?.notifTarefasAtivo ?? true,
      notifTarefasAntecedencia: prefs?.notifTarefasAntecedencia ?? 1440,
      notifTarefasAtrasadas: prefs?.notifTarefasAtrasadas ?? true,
      notifEstudoInicio: prefs?.notifEstudoInicio ?? true,
      notifEstudoFimPausa: prefs?.notifEstudoFimPausa ?? true,
      notifEstudoFimSessao: prefs?.notifEstudoFimSessao ?? true,
      notifObjectivosAtivo: prefs?.notifObjectivosAtivo ?? true,
      notifObjectivosDias: prefs?.notifObjectivosDias ?? 3,
      notifLembretesAtivo: prefs?.notifLembretesAtivo ?? true,
      browserNotif: prefs?.browserNotif ?? false,
      emailNotif: prefs?.emailNotif ?? false,
      emailNotifAddress: prefs?.emailNotifAddress ?? user.email,
    },
  };
}

export async function getSettingsAction() {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error, data: null };

    return { success: true, data: serializeSettings(user) };
  } catch (error) {
    console.error("Error loading settings:", error);
    return { success: false, error: "Erro ao carregar definições", data: null };
  }
}

export async function updateSettingsAction(input: SettingsData) {
  try {
    const { user, error } = await getCurrentUser();
    if (!user) return { success: false, error, data: null };

    const duration = Math.min(480, Math.max(5, Math.round(Number(input.duracaoTarefaPadrao) || 60)));
    const objectiveDays = Math.min(30, Math.max(1, Math.round(Number(input.notificacoes.notifObjectivosDias) || 3)));
    const taskLead = Math.min(10080, Math.max(0, Math.round(Number(input.notificacoes.notifTarefasAntecedencia) || 0)));

    await prisma.utilizador.update({
      where: { id: user.id },
      data: {
        modoAppearance: input.modoAppearance,
        corAcento: input.corAcento,
        primeiroDiaSemana: input.primeiroDiaSemana as any,
        mostrarFimSemana: input.mostrarFimSemana,
        duracaoTarefaPadrao: duration,
        anoLectivoInicio: toDateOrNull(input.anoLectivoInicio),
        anoLectivoFim: toDateOrNull(input.anoLectivoFim),
      },
    });

    await prisma.preferenciaNotificacao.upsert({
      where: { utilizadorId: user.id },
      create: {
        utilizadorId: user.id,
        notifTarefasAtivo: input.notificacoes.notifTarefasAtivo,
        notifTarefasAntecedencia: taskLead,
        notifTarefasAtrasadas: input.notificacoes.notifTarefasAtrasadas,
        notifEstudoInicio: input.notificacoes.notifEstudoInicio,
        notifEstudoFimPausa: input.notificacoes.notifEstudoFimPausa,
        notifEstudoFimSessao: input.notificacoes.notifEstudoFimSessao,
        notifObjectivosAtivo: input.notificacoes.notifObjectivosAtivo,
        notifObjectivosDias: objectiveDays,
        notifLembretesAtivo: input.notificacoes.notifLembretesAtivo,
        browserNotif: input.notificacoes.browserNotif,
        emailNotif: input.notificacoes.emailNotif,
        emailNotifAddress: input.notificacoes.emailNotifAddress || null,
      },
      update: {
        notifTarefasAtivo: input.notificacoes.notifTarefasAtivo,
        notifTarefasAntecedencia: taskLead,
        notifTarefasAtrasadas: input.notificacoes.notifTarefasAtrasadas,
        notifEstudoInicio: input.notificacoes.notifEstudoInicio,
        notifEstudoFimPausa: input.notificacoes.notifEstudoFimPausa,
        notifEstudoFimSessao: input.notificacoes.notifEstudoFimSessao,
        notifObjectivosAtivo: input.notificacoes.notifObjectivosAtivo,
        notifObjectivosDias: objectiveDays,
        notifLembretesAtivo: input.notificacoes.notifLembretesAtivo,
        browserNotif: input.notificacoes.browserNotif,
        emailNotif: input.notificacoes.emailNotif,
        emailNotifAddress: input.notificacoes.emailNotifAddress || null,
      },
    });

    const updated = await prisma.utilizador.findUnique({
      where: { id: user.id },
      include: { preferenciasNotif: true },
    });

    return { success: true, data: serializeSettings(updated) };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { success: false, error: "Erro ao guardar definições", data: null };
  }
}
