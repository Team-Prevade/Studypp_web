"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Edit2, Plus, Trash2, X } from "lucide-react";
import { formatarHora, getInicioDaSemana } from "@/lib/date-utils";
import {
  createAulaAction,
  deleteAulaAction,
  updateAulaAction,
} from "@/lib/timetable-actions";
import { useRouter } from "next/navigation";

interface Disciplina {
  id: string;
  nome: string;
  cor: string;
  professor?: string | null;
}

interface Aula {
  id: string;
  disciplinaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  sala?: string | null;
  professor?: string | null;
  cor?: string | null;
  disciplina: Disciplina;
}

interface TimetableProps {
  initialStartDate: Date | string;
  initialAulas: Aula[];
  horas: string[];
  disciplinas: Disciplina[];
}

export function TimetableView({
  initialStartDate,
  initialAulas,
  horas,
  disciplinas,
}: TimetableProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(initialStartDate),
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [aulas, setAulas] = useState<Aula[]>(initialAulas);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    aulaId?: string;
    diaSemana: string;
    horaInicio: string;
    horaFim: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    disciplinaId: disciplinas[0]?.id || "",
    horaFim: "",
    sala: "",
  });

  const diasSemana = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"];
  const diasNomes = ["SEG", "TER", "QUA", "QUI", "SEX"];

  const semanaAtual = getInicioDaSemana(currentDate);
  const diasDatas = diasSemana.map((_, i) => {
    const data = new Date(semanaAtual);
    data.setDate(data.getDate() + i);
    return data;
  });

  const hoje = new Date();
  const isHojeColuna = (index: number) => {
    const dia = diasDatas[index];
    return (
      dia.getDate() === hoje.getDate() &&
      dia.getMonth() === hoje.getMonth() &&
      dia.getFullYear() === hoje.getFullYear()
    );
  };

  const proximaSemana = () => {
    const nova = new Date(currentDate);
    nova.setDate(nova.getDate() + 7);
    setCurrentDate(nova);
  };

  const semanaAnterior = () => {
    const nova = new Date(currentDate);
    nova.setDate(nova.getDate() - 7);
    setCurrentDate(nova);
  };

  const getAulasDoDia = (dia: string) => {
    return aulas.filter((a) => a.diaSemana === dia);
  };

  const horasTabela = useMemo(() => {
    const base = horas.length > 0 ? [...horas] : ["08:00", "10:00", "12:00"];
    return base.sort().filter((hora) => hora.endsWith(":00"));
  }, [horas]);

  const getProximaHora = (hora: string) => {
    const [h] = hora.split(":").map(Number);
    return `${String(h + 1).padStart(2, "0")}:00`;
  };

  const handleOpenSlot = (diaSemana: string, horaInicio: string) => {
    if (!isEditMode) return;
    const horaFim = getProximaHora(horaInicio);
    setSelectedSlot({ diaSemana, horaInicio, horaFim, aulaId: undefined });
    setFormData((prev) => ({
      ...prev,
      disciplinaId: disciplinas[0]?.id || "",
      horaFim,
      sala: "",
    }));
    setError(null);
  };

  const handleEditAula = (aula: Aula) => {
    if (!isEditMode) return;
    setSelectedSlot({
      aulaId: aula.id,
      diaSemana: aula.diaSemana,
      horaInicio: aula.horaInicio,
      horaFim: aula.horaFim,
    });
    setFormData({
      disciplinaId: aula.disciplinaId,
      horaFim: aula.horaFim,
      sala: aula.sala || "",
    });
    setError(null);
  };

  const handleCreateAula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !formData.disciplinaId) return;

    setLoading(true);
    setError(null);
    const result = selectedSlot.aulaId
      ? await updateAulaAction({
          aulaId: selectedSlot.aulaId,
          disciplinaId: formData.disciplinaId,
          diaSemana: selectedSlot.diaSemana,
          horaInicio: selectedSlot.horaInicio,
          horaFim: formData.horaFim,
          sala: formData.sala.trim() || undefined,
        })
      : await createAulaAction({
          disciplinaId: formData.disciplinaId,
          diaSemana: selectedSlot.diaSemana,
          horaInicio: selectedSlot.horaInicio,
          horaFim: formData.horaFim,
          sala: formData.sala.trim() || undefined,
        });

    if (!result.success || !result.data) {
      setError(
        result.error ||
          (selectedSlot.aulaId
            ? "Não foi possível atualizar a aula."
            : "Não foi possível adicionar a aula."),
      );
      setLoading(false);
      return;
    }

    setAulas((prev) => {
      if (selectedSlot.aulaId) {
        return prev.map((a) => (a.id === selectedSlot.aulaId ? (result.data as Aula) : a));
      }
      return [...prev, result.data as Aula];
    });
    setSelectedSlot(null);
    setFormData((prev) => ({
      ...prev,
      disciplinaId: disciplinas[0]?.id || prev.disciplinaId,
      sala: "",
      horaFim: "",
    }));
    setLoading(false);
    router.refresh();
  };

  const handleDeleteAula = async (aulaId: string) => {
    setLoading(true);
    setError(null);
    const result = await deleteAulaAction(aulaId);
    if (!result.success) {
      setError(result.error || "Não foi possível remover a aula.");
      setLoading(false);
      return;
    }
    setAulas((prev) => prev.filter((a) => a.id !== aulaId));
    setLoading(false);
    router.refresh();
  };

  const formatRangeLabel = () => {
    return `${diasDatas[0].getDate()} ${getMonthShortName(diasDatas[0].getMonth())} - ${diasDatas[4].getDate()} ${getMonthShortName(diasDatas[4].getMonth())}`;
  };

  const getDisciplinaById = (disciplinaId: string) => {
    return disciplinas.find((disciplina) => disciplina.id === disciplinaId);
  };

  const getAulaCor = (aula: Aula) => {
    return aula.cor || aula.disciplina.cor || "#2563eb";
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const cleanedHex = hex.replace("#", "");
    if (cleanedHex.length !== 6) return `rgba(37, 99, 235, ${alpha})`;
    const parsed = Number.parseInt(cleanedHex, 16);
    const r = (parsed >> 16) & 255;
    const g = (parsed >> 8) & 255;
    const b = parsed & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <>
      <div className="w-full px-1 py-1">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Horário semanal</h1>
            <p className="mt-1 text-sm text-gray-600">
              O teu horário da semana com edição rápida por bloco.
            </p>
          </div>
          <button
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setSelectedSlot(null);
              setError(null);
            }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              isEditMode
                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {isEditMode ? (
              <>
                <X className="w-4 h-4" />
                Sair do modo edição
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Modo de edição
              </>
            )}
          </button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={semanaAnterior}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>

          <div className="min-w-44 rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700">
            {formatRangeLabel()}
          </div>

          <button
            onClick={proximaSemana}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {isEditMode && (
          <p className="mt-3 text-xs text-blue-700">
            Clica num bloco vazio para adicionar, ou num bloco existente para editar.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-24 px-4 py-4 text-left text-xs font-medium text-gray-600">
                Hora
              </th>
              {diasNomes.map((dia, i) => (
                <th
                  key={dia}
                  className={`border-l border-gray-200 px-4 py-3 text-center ${
                    isHojeColuna(i) ? "bg-blue-50" : ""
                  }`}
                >
                  <div
                    className={`text-xs font-medium ${
                      isHojeColuna(i) ? "text-blue-700" : "text-gray-500"
                    }`}
                  >
                    {dia}
                  </div>
                  <div
                    className={`text-xl font-semibold ${
                      isHojeColuna(i) ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {diasDatas[i].getDate()}
                  </div>
                  {isHojeColuna(i) && (
                    <div className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      Hoje
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horasTabela.map((hora) => {
              return (
                <tr key={hora} className="h-24 border-b border-gray-200">
                  <td className="align-top border-r border-gray-200 bg-gray-50 px-4 py-3 text-right text-xs font-medium text-gray-600">
                    {formatarHora(hora)}
                  </td>

                  {diasSemana.map((dia) => (
                    <td
                      key={`${dia}-${hora}`}
                      className={`relative align-top border-l border-gray-200 px-2 py-2 ${
                        isEditMode ? "cursor-pointer transition-colors duration-150 hover:bg-blue-50/70" : ""
                      }`}
                      onClick={() => handleOpenSlot(dia, hora)}
                    >
                      {/* Display classes that start at this time */}
                      {getAulasDoDia(dia)
                        .filter((a) => a.horaInicio === hora)
                        .map((aula) => {
                          const aulaCor = getAulaCor(aula);

                          return (
                            <div
                              key={aula.id}
                              className="group relative mb-1 rounded-lg border border-gray-200 border-l-4 p-3 text-sm text-gray-700 transition-shadow duration-150 hover:shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAula(aula);
                              }}
                              style={{
                                borderLeftColor: aulaCor,
                                backgroundColor: hexToRgba(aulaCor, 0.14),
                              }}
                            >
                              <div className="font-semibold text-gray-900">
                                {aula.disciplina.nome}
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                {aula.professor ||
                                  getDisciplinaById(aula.disciplinaId)
                                    ?.professor ||
                                  "Sem professor"}
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                {aula.sala || "Sem sala"}
                              </div>

                              {isEditMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAula(aula.id);
                                  }}
                                  className="absolute right-1 top-1 rounded-lg p-1 text-gray-400 opacity-0 transition duration-150 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                                  disabled={loading}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      {getAulasDoDia(dia).filter((a) => a.horaInicio === hora)
                        .length === 0 && (
                        <div className="flex min-h-16 h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
                          Sem aula
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {aulas.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm text-gray-500">
            Nenhuma aula agendada para esta semana
          </p>
        </div>
      )}
      </div>

      {isEditMode && selectedSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedSlot.aulaId ? "Editar disciplina" : "Adicionar disciplina"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedSlot.diaSemana} - início às{" "}
                  {formatarHora(selectedSlot.horaInicio)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                  className="rounded-lg p-1 text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAula} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Disciplina
                </label>
                <select
                  value={formData.disciplinaId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      disciplinaId: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {disciplinas.map((disciplina) => (
                    <option key={disciplina.id} value={disciplina.id}>
                      {disciplina.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Hora início
                  </label>
                  <input
                    type="text"
                    value={selectedSlot.horaInicio}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Hora fim
                  </label>
                  <input
                    type="time"
                    value={formData.horaFim}
                    min={selectedSlot.horaInicio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, horaFim: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sala (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: B204"
                  value={formData.sala}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sala: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.disciplinaId}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {selectedSlot.aulaId ? "Guardar alterações" : "Adicionar disciplina"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function getMonthShortName(month: number): string {
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return months[month];
}
