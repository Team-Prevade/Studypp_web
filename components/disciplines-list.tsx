"use client";

import { useState } from "react";
import { Edit2, Trash2, BookOpen, Calendar, FileText } from "lucide-react";
import { updateDisciplineAction, deleteDisciplineAction } from "@/lib/disciplines-actions";

interface DisciplineStats {
  aulas: number;
  tarefas: number;
  notas: number;
}

interface Disciplina {
  id: string;
  nome: string;
  cor?: string;
  _count?: DisciplineStats;
}

interface DisciplinesListProps {
  disciplinas: Disciplina[];
}

export function DisciplinesList({ disciplinas }: DisciplinesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nome: "", cor: "" });

  const handleEditClick = (disciplina: Disciplina) => {
    setEditingId(disciplina.id);
    setFormData({ nome: disciplina.nome, cor: disciplina.cor || "#1e3a8a" });
  };

  const handleUpdateDiscipline = async (disciplinaId: string) => {
    if (!formData.nome.trim()) return;

    setLoading(true);
    await updateDisciplineAction(disciplinaId, formData.nome, formData.cor);
    setEditingId(null);
    setFormData({ nome: "", cor: "" });
    setLoading(false);
    window.location.reload();
  };

  const handleDelete = async (disciplinaId: string) => {
    if (
      confirm(
        "Tem a certeza que deseja eliminar esta disciplina? Todas as notas e tarefas relacionadas serão também eliminadas."
      )
    ) {
      setLoading(true);
      await deleteDisciplineAction(disciplinaId);
      setLoading(false);
      window.location.reload();
    }
  };

  const colorOptions = [
    "#1e3a8a", // blue-900
    "#dc2626", // red-600
    "#15803d", // green-700
    "#7c3aed", // violet-600
    "#ea580c", // orange-600
    "#0891b2", // cyan-600
    "#e11d48", // rose-600
  ];

  return (
    <div className="space-y-6">
      {disciplinas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Você ainda não adicionou disciplinas. Comece pelo onboarding ou
            crie uma nova disciplina.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disciplinas.map((disciplina) => (
            <div
              key={disciplina.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Color header */}
              <div
                className="h-12"
                style={{
                  backgroundColor: disciplina.cor || "#1e3a8a",
                }}
              ></div>

              {/* Content */}
              <div className="p-6">
                {editingId === disciplina.id ? (
                  <form
                    onSubmit={() => handleUpdateDiscipline(disciplina.id)}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      placeholder="Nome da disciplina"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={loading}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, cor: color })
                          }
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            formData.cor === color
                              ? "border-gray-900 scale-110"
                              : "border-gray-300"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        disabled={loading || !formData.nome.trim()}
                      >
                        {loading ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {disciplina.nome}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(disciplina)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          disabled={loading}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(disciplina.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {disciplina._count?.aulas || 0} aulas
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">
                          {disciplina._count?.tarefas || 0} tarefas
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">
                          {disciplina._count?.notas || 0} notas
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
