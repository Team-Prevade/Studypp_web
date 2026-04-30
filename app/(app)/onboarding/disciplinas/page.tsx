"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Plus, X } from "lucide-react";
import {
  addDisciplinaAction,
  removeDisciplinaAction,
  getDisciplinasAction,
} from "@/lib/onboarding-actions";

interface Disciplina {
  id: string;
  nome: string;
  cor: string;
}

const PRESET_COLORS = [
  { name: "Azul", hex: "#185FA5" },
  { name: "Roxo", hex: "#8B5CF6" },
  { name: "Castanho", hex: "#92400E" },
  { name: "Teal", hex: "#0D6E6D" },
  { name: "Roxo Escuro", hex: "#4C1D95" },
  { name: "Laranja", hex: "#EA8A4F" },
  { name: "Índigo", hex: "#6366F1" },
];

export default function DisciplinasStep() {
  const router = useRouter();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [nomeDisciplina, setNomeDisciplina] = useState("");
  const [corSelecionada, setCorSelecionada] = useState(PRESET_COLORS[0].hex);
  const [loading, setLoading] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [error, setError] = useState("");

  // Load disciplinas on mount
  useEffect(() => {
    const loadDisciplinas = async () => {
      setLoading(true);
      const result = await getDisciplinasAction();
      if (result.success) {
        setDisciplinas(result.data);
      }
      setLoading(false);
    };
    loadDisciplinas();
  }, []);

  const handleAddDisciplina = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeDisciplina.trim()) {
      setError("Por favor, insira o nome da disciplina");
      return;
    }

    setLoadingAdd(true);
    setError("");

    try {
      const result = await addDisciplinaAction(nomeDisciplina, corSelecionada);

      if (!result.success) {
        setError(result.error || "Erro ao adicionar disciplina");
        return;
      }

      // Add to local state
      setDisciplinas([
        ...disciplinas,
        {
          id: result.data.id,
          nome: result.data.nome,
          cor: result.data.cor,
        },
      ]);

      setNomeDisciplina("");
      setCorSelecionada(PRESET_COLORS[0].hex);
    } catch (err) {
      console.error("Error:", err);
      setError("Erro ao processar pedido");
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRemoveDisciplina = async (id: string) => {
    try {
      const result = await removeDisciplinaAction(id);
      if (result.success) {
        setDisciplinas(disciplinas.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleContinue = () => {
    router.push("/onboarding/horario");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Adiciona as tuas disciplinas
        </h1>
        <p className="text-gray-600">
          Organiza o teu semestre atribuindo uma cor a cada disciplina. Isto ajudará a manter o
          teu horário e tarefas visualmente distintos.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-8">
        {/* Add Disciplina Form */}
        <form onSubmit={handleAddDisciplina} className="mb-10 pb-10 border-b border-gray-200">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Nome da disciplina
            </label>
            <input
              type="text"
              value={nomeDisciplina}
              onChange={(e) => {
                setNomeDisciplina(e.target.value);
                setError("");
              }}
              placeholder="Ex: Matemática Aplicada"
              className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 placeholder-gray-500"
              disabled={loadingAdd}
            />
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Atribuir cor</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setCorSelecionada(color.hex)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    corSelecionada === color.hex
                      ? "border-gray-900 scale-110"
                      : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Add Button */}
          <button
            type="submit"
            disabled={loadingAdd || !nomeDisciplina.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Plus className="w-4 h-4" />
            {loadingAdd ? "Adicionando..." : "Adicionar disciplina"}
          </button>
        </form>

        {/* Disciplinas List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Disciplinas adicionadas ({disciplinas.length})
          </h3>

          {disciplinas.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-2">Ainda não tem disciplinas adicionadas.</p>
              <p className="text-sm text-gray-500">
                Adicione pelo menos uma para continuar (opcional).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {disciplinas.map((disciplina) => (
                <div
                  key={disciplina.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: disciplina.cor }}
                    />
                    <span className="font-medium text-gray-900">{disciplina.nome}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDisciplina(disciplina.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
          onClick={handleContinue}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
