"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { createDisciplineAction } from "@/lib/disciplines-actions";

interface DisciplinaStats {
  id: string;
  nome: string;
  cor: string;
  professor?: string;
  totalAulas: number;
  totalTarefas: number;
  totalAvaliacoes: number;
  mediaAvaliacoes: number;
  totalTestes: number;
  totalHorasEstudo: number;
}

interface DisciplinesPageProps {
  disciplinas: DisciplinaStats[];
}

export function DisciplinesPage({ disciplinas }: DisciplinesPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    professor: "",
    cor: "#1e40af",
  });

  const handleCreateDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setLoading(true);
    await createDisciplineAction(
      formData.nome,
      formData.professor,
      formData.cor,
    );
    setFormData({ nome: "", professor: "", cor: "#1e40af" });
    setShowForm(false);
    setLoading(false);
    window.location.reload();
  };

  const colorPalette = [
    "#1e40af", // blue-800
    "#0369a1", // cyan-600
    "#0891b2", // cyan-700
    "#06b6d4", // cyan-500
    "#7c3aed", // violet-600
    "#ec4899", // pink-500
    "#f97316", // orange-500
  ];

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Suas disciplinas</h1>
          <p className="mt-2 text-gray-600">
            Gerencie suas matérias, acompanhe seu desempenho e mantenha seu foco
            académico alinhado.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-700"
        >
          <Plus size={20} />
          Nova disciplina
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Adicionar nova
          </h2>
          <form onSubmit={handleCreateDiscipline} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome da disciplina
              </label>
              <input
                type="text"
                placeholder="Ex: Sistemas Operativos"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Professor responsável
              </label>
              <input
                type="text"
                placeholder="Ex: Dra. Marta Costa"
                value={formData.professor}
                onChange={(e) =>
                  setFormData({ ...formData, professor: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cor identificadora
              </label>
              <div className="mt-3 flex gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor: color })}
                    className={`h-10 w-10 rounded-full transition ${
                      formData.cor === color
                        ? "ring-2 ring-offset-2 ring-gray-400"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? "A guardar..." : "Guardar disciplina"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disciplines List */}
      <div className="space-y-4">
        {disciplinas.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              Não tem nenhuma disciplina ainda. Crie a primeira!
            </p>
          </div>
        ) : (
          disciplinas.map((disciplina) => (
            <div key={disciplina.id} className="rounded-xl border border-gray-200 bg-white">
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === disciplina.id ? null : disciplina.id,
                  )
                }
                className="w-full px-6 py-4 text-left transition hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Color indicator */}
                    <div
                      className="mt-1 h-12 w-1 rounded-full"
                      style={{ backgroundColor: disciplina.cor }}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        {disciplina.nome}
                      </h3>
                      {disciplina.professor && (
                        <p className="mt-1 text-sm text-gray-600">
                          ◆ {disciplina.professor}
                        </p>
                      )}
                      {disciplina.totalAulas > 0 && (
                        <p className="text-xs text-gray-500">
                          ◆ Sem {new Date().getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats preview */}
                  <div className="ml-4 flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-green-600">
                          {disciplina.totalTestes}
                        </span>
                        <span className="text-xs text-gray-600">/</span>
                        <span className="text-sm text-gray-600">
                          {disciplina.totalAvaliacoes}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Testes completos</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {disciplina.mediaAvaliacoes.toFixed(1)}
                      </div>
                      <p className="text-xs text-gray-500">Média atual</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-2xl font-bold text-purple-600">
                          {disciplina.totalHorasEstudo}
                        </span>
                        <span className="text-xs text-gray-600">h</span>
                      </div>
                      <p className="text-xs text-gray-500">Horas estudo</p>
                    </div>
                  </div>

                  {/* Expand icon */}
                  <div className="ml-4">
                    {expandedId === disciplina.id ? (
                      <ChevronUp className="text-gray-400" size={24} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={24} />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {expandedId === disciplina.id && (
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="rounded-lg bg-white p-3 text-center">
                      <div className="text-lg font-bold text-green-600">
                        {disciplina.totalTestes}
                        <span className="text-sm text-gray-600">/</span>
                        {disciplina.totalAvaliacoes}
                      </div>
                      <p className="text-xs text-gray-600">Testes completos</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {disciplina.mediaAvaliacoes.toFixed(1)}
                      </div>
                      <p className="text-xs text-gray-600">Média atual</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-lg font-bold text-purple-600">
                          {disciplina.totalHorasEstudo}
                        </span>
                        <span className="text-xs text-gray-600">h</span>
                      </div>
                      <p className="text-xs text-gray-600">Horas estudo</p>
                    </div>
                  </div>
                  <button className="w-full rounded-lg bg-white py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50">
                    Ver detalhes
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
