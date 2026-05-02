"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { getCalendarEventStyle } from "@/lib/calendar-event-style";
import {
  CalendarEventDialog,
  type CalendarEventRecord,
  type DisciplinaCalendarOption,
} from "@/components/calendar-event-dialog";

export interface CalendarDaySerializedEvent {
  id: string;
  titulo: string;
  tipo: string;
  notas?: string | null;
  dataInicio: string;
  dataFim?: string | null;
  disciplina?: { id: string; nome: string; cor: string } | null;
}

export interface CalendarDaySerializedAvaliacao {
  id: string;
  tipo: string;
  data: string;
  disciplina?: { nome: string };
}

export interface CalendarDaySerializedTarefa {
  id: string;
  titulo: string;
  prazo: string;
  disciplina?: { nome: string; cor?: string } | null;
}

function capitalizePT(s: string) {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("pt-PT") + s.slice(1);
}

function formatDayHeading(isoDate: string) {
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3) return isoDate;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return capitalizePT(
    new Intl.DateTimeFormat("pt-PT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dt),
  );
}

function formatClockPt(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function formatTimeSpan(isoStart: string, isoEnd?: string | null) {
  const end = isoEnd ?? isoStart;
  return `${formatClockPt(isoStart)} – ${formatClockPt(end)}`;
}

interface Props {
  isoDate: string;
  disciplinas: DisciplinaCalendarOption[];
  eventos: CalendarDaySerializedEvent[];
  avaliacoes: CalendarDaySerializedAvaliacao[];
  tarefas: CalendarDaySerializedTarefa[];
}

export function CalendarDayView({ isoDate, disciplinas, eventos, avaliacoes, tarefas }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogIntent, setDialogIntent] = useState<"create" | "detail" | null>(null);
  const [presetDateISO, setPresetDateISO] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEventRecord | null>(null);

  const eventosHydrated = useMemo<CalendarEventRecord[]>(
    () =>
      eventos.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        notas: e.notas ?? null,
        disciplina: e.disciplina ?? null,
        dataInicio: new Date(e.dataInicio),
        dataFim: e.dataFim ? new Date(e.dataFim) : null,
      })),
    [eventos],
  );

  const openCreate = () => {
    setDialogIntent("create");
    setPresetDateISO(isoDate);
    setDetailEvent(null);
    setDialogOpen(true);
  };

  const openDetail = (evt: CalendarEventRecord) => {
    setDetailEvent(evt);
    setPresetDateISO(null);
    setDialogIntent("detail");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogIntent(null);
    setPresetDateISO(null);
    setDetailEvent(null);
  };

  return (
    <div className="w-full">
      <Link
        href="/calendario"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao calendário
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{formatDayHeading(isoDate)}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {eventosHydrated.length} eventos • {avaliacoes.length} avaliações • {tarefas.length} entregas
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo evento
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Eventos</h2>
          {eventosHydrated.length === 0 ? (
            <p className="text-sm text-gray-600">Sem eventos neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {eventosHydrated.map((evt) => {
                const style = getCalendarEventStyle(evt.tipo);

                return (
                  <li key={evt.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(evt)}
                      className="flex w-full items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-shadow duration-150 hover:shadow-sm"
                    >
                      <span
                        className="mt-1 h-3 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: style.color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">{evt.titulo}</p>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: style.softColor, color: style.color }}
                          >
                            {style.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                          {formatTimeSpan(evt.dataInicio.toISOString(), evt.dataFim?.toISOString() ?? null)}
                          {evt.disciplina?.nome ? ` · ${evt.disciplina.nome}` : ""}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Avaliações</h2>
          {avaliacoes.length === 0 ? (
            <p className="text-sm text-gray-600">Sem avaliações agendadas.</p>
          ) : (
            <ul className="space-y-2">
              {avaliacoes.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <span className="mt-1 h-3 w-1 shrink-0 rounded-full bg-orange-500" aria-hidden />
                  <div>
                    <p className="font-medium text-gray-900">
                      {a.tipo.replace(/_/g, " ")}
                      {a.disciplina?.nome ? ` · ${a.disciplina.nome}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{formatClockPt(a.data)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Entregas (prazos)</h2>
          {tarefas.length === 0 ? (
            <p className="text-sm text-gray-600">Sem prazos neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {tarefas.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <span className="mt-1 h-3 w-1 shrink-0 rounded-full bg-teal-500" aria-hidden />
                  <div>
                    <p className="font-medium text-gray-900">{t.titulo}</p>
                    <p className="mt-1 text-xs text-gray-600">{formatClockPt(t.prazo)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CalendarEventDialog
        open={dialogOpen}
        onClose={closeDialog}
        disciplinas={disciplinas}
        intent={dialogIntent}
        presetDateISO={presetDateISO}
        detailEvent={detailEvent}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
