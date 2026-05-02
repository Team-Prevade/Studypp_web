"use client";

import type { TipoEvento } from "@prisma/client";
import { useLayoutEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { getCalendarEventStyle } from "@/lib/calendar-event-style";
import {
  createCalendarEventAction,
  deleteCalendarEventAction,
  updateCalendarEventAction,
} from "@/lib/calendar-actions";

export type CalendarEventRecord = {
  id: string;
  dataInicio: Date;
  dataFim?: Date | null;
  titulo: string;
  tipo: string;
  notas?: string | null;
  disciplina?: { id: string; nome: string; cor: string } | null;
};

export type DisciplinaCalendarOption = {
  id: string;
  nome: string;
  cor: string;
};

type TipoEventoInput =
  | "TESTE_EXAME"
  | "ENTREGA_TRABALHO"
  | "EVENTO_PESSOAL"
  | "FERIADO";

function toDateInputValue(d: Date) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(d: Date) {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
}

function formatDateTimePT(d: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export interface CalendarEventDialogProps {
  open: boolean;
  onClose: () => void;
  disciplinas: DisciplinaCalendarOption[];
  intent: "create" | "detail" | null;
  presetDateISO?: string | null;
  detailEvent?: CalendarEventRecord | null;
  onSuccess: () => void;
}

export function CalendarEventDialog({
  open,
  onClose,
  disciplinas,
  intent,
  presetDateISO,
  detailEvent,
  onSuccess,
}: CalendarEventDialogProps) {
  const [surface, setSurface] = useState<"detail" | "form">("form");
  const [cameFromDetail, setCameFromDetail] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emptyForm = () => ({
    titulo: "",
    tipo: "EVENTO_PESSOAL" as TipoEventoInput,
    dataInicio: "",
    dataFim: "",
    horaInicio: "09:00",
    horaFim: "10:00",
    disciplinaId: "",
    notas: "",
  });

  const [form, setForm] = useState(emptyForm());

  const [detailSnapshot, setDetailSnapshot] = useState<CalendarEventRecord | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setSurface("form");
      setCameFromDetail(false);
      setEditingEventId(null);
      setSubmitError(null);
      setForm(emptyForm());
      setDetailSnapshot(null);
      setIsSubmitting(false);
      return;
    }

    if (intent === "detail" && detailEvent) {
      setDetailSnapshot(detailEvent);
      setEditingEventId(detailEvent.id);
      setSurface("detail");
      setCameFromDetail(false);
      setSubmitError(null);
      const fimDt = detailEvent.dataFim ?? detailEvent.dataInicio;
      setForm({
        titulo: detailEvent.titulo,
        tipo: detailEvent.tipo as TipoEventoInput,
        dataInicio: toDateInputValue(detailEvent.dataInicio),
        dataFim: toDateInputValue(fimDt),
        horaInicio: toTimeInputValue(detailEvent.dataInicio),
        horaFim: toTimeInputValue(fimDt),
        disciplinaId: detailEvent.disciplina?.id ?? "",
        notas: detailEvent.notas ?? "",
      });
      return;
    }

    if (intent === "create") {
      setEditingEventId(null);
      setDetailSnapshot(null);
      setSurface("form");
      setCameFromDetail(false);
      setSubmitError(null);
      const hojeISO = presetDateISO || toDateInputValue(new Date());
      setForm({
        ...emptyForm(),
        dataInicio: hojeISO,
        dataFim: hojeISO,
      });
    }
  }, [open, intent, presetDateISO, detailEvent]);

  const startEditFromDetail = () => {
    setCameFromDetail(true);
    setSurface("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.dataInicio) {
      setSubmitError("Preenche o título e a data de início.");
      return;
    }

    const endDatePart = form.dataFim.trim() ? form.dataFim : form.dataInicio;
    const inicioDt = new Date(`${form.dataInicio}T${form.horaInicio}:00`);
    const fimDt = new Date(`${endDatePart}T${form.horaFim}:00`);

    if (Number.isNaN(inicioDt.getTime()) || Number.isNaN(fimDt.getTime())) {
      setSubmitError("Data ou hora inválida.");
      return;
    }
    if (fimDt < inicioDt) {
      setSubmitError("A hora de fim tem de ser igual ou posterior à de início.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    if (editingEventId) {
      const result = await updateCalendarEventAction({
        eventoId: editingEventId,
        titulo: form.titulo,
        tipo: form.tipo as TipoEvento,
        dataInicio: inicioDt,
        dataFim: fimDt,
        disciplinaId: form.disciplinaId || null,
        notas: form.notas || null,
        diaInteiro: false,
      });
      if (!result.success || !result.data) {
        setSubmitError(result.error || "Não foi possível atualizar o evento.");
        setIsSubmitting(false);
        return;
      }
    } else {
      const result = await createCalendarEventAction({
        titulo: form.titulo,
        tipo: form.tipo as TipoEvento,
        dataInicio: inicioDt,
        dataFim: fimDt,
        disciplinaId: form.disciplinaId || undefined,
        notas: form.notas || undefined,
        diaInteiro: false,
      });
      if (!result.success || !result.data) {
        setSubmitError(result.error || "Não foi possível criar o evento.");
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  const handleDelete = async () => {
    if (!editingEventId) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Eliminar este evento? Esta ação não pode ser desfeita.")
    ) {
      return;
    }
    setIsSubmitting(true);
    const result = await deleteCalendarEventAction(editingEventId);
    setIsSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error || "Não foi possível eliminar.");
      return;
    }
    onSuccess();
    onClose();
  };

  const cancelFormAction = () => {
    setSubmitError(null);
    if (cameFromDetail && detailSnapshot) {
      const fimDt = detailSnapshot.dataFim ?? detailSnapshot.dataInicio;
      setForm({
        titulo: detailSnapshot.titulo,
        tipo: detailSnapshot.tipo as TipoEventoInput,
        dataInicio: toDateInputValue(detailSnapshot.dataInicio),
        dataFim: toDateInputValue(fimDt),
        horaInicio: toTimeInputValue(detailSnapshot.dataInicio),
        horaFim: toTimeInputValue(fimDt),
        disciplinaId: detailSnapshot.disciplina?.id ?? "",
        notas: detailSnapshot.notas ?? "",
      });
      setSurface("detail");
      setCameFromDetail(false);
      return;
    }
    onClose();
  };

  if (!open) {
    return null;
  }

  const showDetail = intent === "detail" && surface === "detail" && detailSnapshot;
  const detailStyle = detailSnapshot ? getCalendarEventStyle(detailSnapshot.tipo) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain px-4 py-8">
      <div
        role="presentation"
        className="fixed inset-0 bg-black/40 transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-lg items-start justify-center sm:py-2">
        <div
          role="dialog"
          aria-modal="true"
          className="relative flex max-h-[min(90vh,calc(100vh-48px))] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {showDetail ? "Detalhe do evento" : editingEventId ? "Editar evento" : "Novo evento"}
              </h2>
              {!showDetail && (
                <p className="mt-1 text-sm text-gray-600">
                  Data e hora de início e de fim. As avaliações e tarefas gerem-se noutras áreas.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1 text-gray-500 transition-colors duration-150 hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {showDetail && detailSnapshot ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-500">Título</p>
                  <p className="mt-0.5 text-base font-semibold text-gray-900">{detailSnapshot.titulo}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Tipo</p>
                  <span
                    className="mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: detailStyle?.softColor,
                      color: detailStyle?.color,
                    }}
                  >
                    {detailStyle?.label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Disciplina</p>
                  <p className="mt-0.5 text-gray-900">{detailSnapshot.disciplina?.nome ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Início</p>
                  <p className="mt-0.5 text-gray-900">{formatDateTimePT(new Date(detailSnapshot.dataInicio))}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Fim</p>
                  <p className="mt-0.5 text-gray-900">
                    {formatDateTimePT(new Date(detailSnapshot.dataFim ?? detailSnapshot.dataInicio))}
                  </p>
                </div>
                {(detailSnapshot.notas?.trim() ?? "").length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Notas</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-gray-900">{detailSnapshot.notas}</p>
                  </div>
                )}
              </div>
            ) : (
              <form id="calendar-event-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
                  <input
                    value={form.titulo}
                    onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Teste de Matemática"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          tipo: event.target.value as TipoEventoInput,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EVENTO_PESSOAL">Pessoal</option>
                      <option value="TESTE_EXAME">Teste/Exame</option>
                      <option value="ENTREGA_TRABALHO">Entrega</option>
                      <option value="FERIADO">Feriado</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Disciplina</label>
                    <select
                      value={form.disciplinaId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, disciplinaId: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sem disciplina</option>
                      {disciplinas.map((disciplina) => (
                        <option key={disciplina.id} value={disciplina.id}>
                          {disciplina.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Data de início</label>
                    <input
                      type="date"
                      value={form.dataInicio}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, dataInicio: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Hora de início</label>
                    <input
                      type="time"
                      value={form.horaInicio}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, horaInicio: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Data de fim <span className="font-normal text-gray-400">(opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={form.dataFim}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, dataFim: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Hora de fim</label>
                    <input
                      type="time"
                      value={form.horaFim}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, horaFim: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    value={form.notas}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, notas: event.target.value }))
                    }
                    className="min-h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Opcional"
                  />
                </div>

                {submitError && <p className="text-sm text-red-600">{submitError}</p>}
              </form>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
            {showDetail && detailSnapshot ? (
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-100"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={startEditFromDetail}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                {editingEventId ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={cancelFormAction}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-100"
                  >
                    {cameFromDetail ? "Voltar" : "Cancelar"}
                  </button>
                  <button
                    type="submit"
                    form="calendar-event-form"
                    disabled={isSubmitting}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSubmitting ? "A guardar..." : editingEventId ? "Guardar alterações" : "Criar evento"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
