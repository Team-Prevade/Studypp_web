"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarPlus, Loader2, Plus, X } from "lucide-react";
import {
  getDisciplinasAction,
  saveTimetableAction,
} from "@/lib/onboarding-actions";

interface Disciplina {
  id: string;
  nome: string;
  cor: string;
}

interface Aula {
  disciplinaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
}

interface GridCell {
  dia: string;
  hora: string;
  disciplina?: Disciplina;
}

const DIAS = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"];
const DAY_LABELS: Record<string, string> = {
  SEGUNDA: "Segunda",
  TERCA: "Terça",
  QUARTA: "Quarta",
  QUINTA: "Quinta",
  SEXTA: "Sexta",
};
const HORAS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

function nextHour(time: string) {
  const hour = Number(time.split(":")[0]);
  return `${String(hour + 1).padStart(2, "0")}:00`;
}

export default function HorarioStep() {
  const router = useRouter();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [gridAulas, setGridAulas] = useState<GridCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLoading, setSavingLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDia, setSelectedDia] = useState("SEGUNDA");
  const [selectedHora, setSelectedHora] = useState("08:00");
  const [selectedDisciplina, setSelectedDisciplina] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await getDisciplinasAction();
      if (result.success && result.data.length > 0) {
        setDisciplinas(result.data);
        setSelectedDisciplina(result.data[0].id);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const getAulaAtCell = (dia: string, hora: string) => {
    return gridAulas.find((aula) => aula.dia === dia && aula.hora === hora);
  };

  const handleAddAula = () => {
    if (!selectedDisciplina) {
      setError("Por favor, selecione uma disciplina");
      return;
    }

    if (getAulaAtCell(selectedDia, selectedHora)) {
      setError("Já existe uma aula neste horário");
      return;
    }

    const disciplina = disciplinas.find((item) => item.id === selectedDisciplina);
    if (!disciplina) return;

    setGridAulas((current) => [
      ...current,
      {
        dia: selectedDia,
        hora: selectedHora,
        disciplina,
      },
    ]);
    setError("");
    setShowAddModal(false);
  };

  const handleRemoveAula = (dia: string, hora: string) => {
    setGridAulas((current) =>
      current.filter((aula) => !(aula.dia === dia && aula.hora === hora)),
    );
  };

  const handleSave = async () => {
    setSavingLoading(true);
    setError("");

    try {
      const aulas: Aula[] = gridAulas
        .filter((cell) => cell.disciplina)
        .map((cell) => ({
          disciplinaId: cell.disciplina!.id,
          diaSemana: cell.dia,
          horaInicio: cell.hora,
          horaFim: nextHour(cell.hora),
        }));

      const result = await saveTimetableAction(aulas);

      if (!result.success) {
        setError(result.error || "Erro ao guardar horário");
        return;
      }

      router.push("/onboarding/conclusao");
    } catch (err) {
      console.error("Error:", err);
      setError("Erro ao processar pedido");
    } finally {
      setSavingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Configura o teu horário
        </h1>
        <p className="text-gray-600">
          Clica nos blocos para atribuir disciplinas ao teu horário semanal.
        </p>
      </div>

      <div className="rounded-lg bg-white p-8 shadow">
        {disciplinas.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="mb-4 text-gray-600">Nenhuma disciplina adicionada.</p>
            <button
              type="button"
              onClick={() => router.push("/onboarding/disciplinas")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Voltar para disciplinas
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-16 border border-gray-200 bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700">
                      Hora
                    </th>
                    {DIAS.map((dia) => (
                      <th
                        key={dia}
                        className="border border-gray-200 bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700"
                      >
                        {DAY_LABELS[dia]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map((hora) => (
                    <tr key={hora}>
                      <td className="border border-gray-200 bg-gray-50 p-2 text-center text-xs font-medium text-gray-600">
                        {hora}
                      </td>
                      {DIAS.map((dia) => {
                        const aula = getAulaAtCell(dia, hora);
                        const disciplina = aula?.disciplina;

                        return (
                          <td
                            key={`${dia}-${hora}`}
                            className="h-12 cursor-pointer border border-gray-200 p-1 hover:bg-gray-50"
                            onClick={() => {
                              if (disciplina) {
                                handleRemoveAula(dia, hora);
                                return;
                              }

                              setSelectedDia(dia);
                              setSelectedHora(hora);
                              setError("");
                              setShowAddModal(true);
                            }}
                          >
                            {disciplina ? (
                              <div
                                className="flex h-full items-center justify-center overflow-hidden rounded text-xs font-semibold text-white hover:ring-2 hover:ring-red-500"
                                style={{ backgroundColor: disciplina.cor }}
                                title={`Clique para remover ${disciplina.nome}`}
                              >
                                <span className="truncate px-1 text-center">
                                  {disciplina.nome}
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="flex h-full w-full items-center justify-center rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                <strong>
                  {gridAulas.length} aula{gridAulas.length !== 1 ? "s" : ""}
                </strong>{" "}
                adicionada{gridAulas.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-blue-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-blue-50/70 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Adicionar aula
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {DAY_LABELS[selectedDia]} às {selectedHora}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:text-gray-800"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Disciplina
                </label>
                <select
                  value={selectedDisciplina}
                  onChange={(e) => setSelectedDisciplina(e.target.value)}
                  className="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-600"
                >
                  {disciplinas.map((disciplina) => (
                    <option key={disciplina.id} value={disciplina.id}>
                      {disciplina.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddAula}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-6 py-2 text-gray-700 transition-colors hover:bg-gray-100"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={savingLoading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <span>Continuar</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
