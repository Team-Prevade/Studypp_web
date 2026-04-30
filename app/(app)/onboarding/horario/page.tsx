"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Plus, X } from "lucide-react";
import { saveTimetableAction, getDisciplinasAction } from "@/lib/onboarding-actions";

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

const DIAS = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA"];
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

interface GridCell {
  dia: string;
  hora: string;
  disciplina?: Disciplina;
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
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("");
  const [error, setError] = useState("");

  // Load disciplinas on mount
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

  const getCellKey = (dia: string, hora: string) => `${dia}-${hora}`;

  const getAulaAtCell = (dia: string, hora: string) => {
    return gridAulas.find((a) => a.dia === dia && a.hora === hora);
  };

  const handleAddAula = () => {
    if (!selectedDisciplina) {
      setError("Por favor, selecione uma disciplina");
      return;
    }

    const existingAula = getAulaAtCell(selectedDia, selectedHora);
    if (existingAula) {
      setError("Já existe uma aula neste horário");
      return;
    }

    const disciplina = disciplinas.find((d) => d.id === selectedDisciplina);
    if (!disciplina) return;

    setGridAulas([
      ...gridAulas,
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
    setGridAulas(gridAulas.filter((a) => !(a.dia === dia && a.hora === hora)));
  };

  const handleSave = async () => {
    setSavingLoading(true);
    setError("");

    try {
      // Convert grid to Aula format
      const aulas: Aula[] = gridAulas.map((cell) => ({
        disciplinaId: cell.disciplina!.id,
        diaSemana: cell.dia,
        horaInicio: cell.hora,
        horaFim: `${parseInt(cell.hora) + 1}:00`,
      }));

      const result = await saveTimetableAction(aulas);

      if (!result.success) {
        setError(result.error || "Erro ao guardar horário");
        return;
      }

      // Redirect to next step
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
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configura o teu horário</h1>
        <p className="text-gray-600">Clica nos blocos para atribuir disciplinas.</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-8">
        {disciplinas.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">Nenhuma disciplina adicionada.</p>
            <button
              onClick={() => router.push("/onboarding/disciplinas")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Voltar para Disciplinas
            </button>
          </div>
        ) : (
          <>
            {/* Grid Schedule */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-16 text-center text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2">
                      Hora
                    </th>
                    {DIAS.map((dia) => (
                      <th
                        key={dia}
                        className="text-center text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2"
                      >
                        {dia.charAt(0) + dia.slice(1).toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map((hora) => (
                    <tr key={hora}>
                      <td className="text-center text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 p-2">
                        {hora}
                      </td>
                      {DIAS.map((dia) => {
                        const aula = getAulaAtCell(dia, hora);
                        return (
                          <td
                            key={`${dia}-${hora}`}
                            className="h-12 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              if (aula) {
                                handleRemoveAula(dia, hora);
                              } else {
                                setSelectedDia(dia);
                                setSelectedHora(hora);
                                setShowAddModal(true);
                              }
                            }}
                          >
                            {aula ? (
                              <div
                                className="h-full rounded flex items-center justify-center text-xs font-semibold text-white overflow-hidden hover:ring-2 hover:ring-red-500"
                                style={{
                                  backgroundColor: aula.disciplina.cor,
                                }}
                                title={`Click para remover ${aula.disciplina.nome}`}
                              >
                                <span className="text-center px-1 truncate">
                                  {aula.disciplina.nome}
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="w-full h-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Plus className="w-4 h-4" />
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

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Stats */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{gridAulas.length} aula{gridAulas.length !== 1 ? "s" : ""}</strong>{" "}
                adicionada{gridAulas.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modal Add Aula */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Adicionar aula {selectedDia} às {selectedHora}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Disciplina</label>
              <select
                value={selectedDisciplina}
                onChange={(e) => setSelectedDisciplina(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddAula}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={savingLoading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
