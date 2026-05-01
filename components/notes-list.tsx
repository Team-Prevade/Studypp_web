"use client";

import { useState } from "react";
import { Trash2, Plus, Edit2, X } from "lucide-react";
import {
  deleteNoteAction,
  createNoteAction,
  updateNoteAction,
} from "@/lib/notes-actions";

interface Disciplina {
  id: string;
  nome: string;
  cor?: string;
}

interface Nota {
  id: string;
  titulo: string;
  conteudo: string;
  disciplinaId: string;
  updatedAt: string | Date;
}

interface NotesListProps {
  notas: Nota[];
  disciplinas: Disciplina[];
  notasPorDisciplina: { [key: string]: Nota[] };
}

export function NotesList({
  notas,
  disciplinas,
  notasPorDisciplina,
}: NotesListProps) {
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(
    disciplinas.length > 0 ? disciplinas[0].id : null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ titulo: "", conteudo: "" });

  const currentNotes = selectedDisciplina
    ? notasPorDisciplina[selectedDisciplina] || []
    : [];

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisciplina) return;

    setLoading(true);
    await createNoteAction(
      selectedDisciplina,
      formData.titulo,
      formData.conteudo,
    );
    setFormData({ titulo: "", conteudo: "" });
    setShowNewNote(false);
    setLoading(false);
    window.location.reload();
  };

  const handleUpdateNote = async (notaId: string) => {
    if (!formData.titulo.trim()) return;

    setLoading(true);
    await updateNoteAction(notaId, formData.titulo, formData.conteudo);
    setEditingId(null);
    setFormData({ titulo: "", conteudo: "" });
    setLoading(false);
    window.location.reload();
  };

  const handleDelete = async (notaId: string) => {
    if (confirm("Tem a certeza que deseja eliminar esta nota?")) {
      setLoading(true);
      await deleteNoteAction(notaId);
      setLoading(false);
      window.location.reload();
    }
  };

  const handleEditClick = (nota: Nota) => {
    setEditingId(nota.id);
    setFormData({ titulo: nota.titulo, conteudo: nota.conteudo });
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Disciplines sidebar */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Disciplinas</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {disciplinas.length === 0 ? (
              <p className="p-4 text-gray-600 text-sm">
                Nenhuma disciplina adicionada
              </p>
            ) : (
              disciplinas.map((d) => {
                const count = notasPorDisciplina[d.id]?.length || 0;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDisciplina(d.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      selectedDisciplina === d.id
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {d.nome}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Notes area */}
      <div className="md:col-span-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedDisciplina
                ? disciplinas.find((d) => d.id === selectedDisciplina)?.nome
                : "Notas"}
            </h2>
            <p className="text-gray-600 mt-1">
              {currentNotes.length}{" "}
              {currentNotes.length === 1 ? "nota" : "notas"}
            </p>
          </div>
          {!showNewNote && selectedDisciplina && (
            <button
              onClick={() => setShowNewNote(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Nova Nota
            </button>
          )}
        </div>

        {/* New note form */}
        {showNewNote && selectedDisciplina && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Criar nova nota</h3>
              <button
                onClick={() => setShowNewNote(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <input
                type="text"
                placeholder="Título da nota"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
              <textarea
                placeholder="Conteúdo da nota"
                value={formData.conteudo}
                onChange={(e) =>
                  setFormData({ ...formData, conteudo: e.target.value })
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={loading || !formData.titulo.trim()}
                >
                  {loading ? "Salvando..." : "Salvar Nota"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewNote(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes list */}
        {currentNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              Nenhuma nota nesta disciplina. Comece criando uma!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentNotes.map((nota) => (
              <div
                key={nota.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                {editingId === nota.id ? (
                  <form
                    onSubmit={() => handleUpdateNote(nota.id)}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      placeholder="Título"
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({ ...formData, titulo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={loading}
                    />
                    <textarea
                      placeholder="Conteúdo"
                      value={formData.conteudo}
                      onChange={(e) =>
                        setFormData({ ...formData, conteudo: e.target.value })
                      }
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        disabled={loading}
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
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {nota.titulo}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(nota.updatedAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(nota)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          disabled={loading}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(nota.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {nota.conteudo}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
