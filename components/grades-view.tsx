"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Beaker,
  BookOpen,
  Calculator,
  Dumbbell,
  Edit2,
  FileText,
  FlaskConical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { TipoAvaliacao } from "@prisma/client";
import {
  createGradeAction,
  deleteGradeAction,
  updateGradeAction,
} from "@/lib/grades-actions";
import { toast } from "sonner";

const TIPO = {
  TESTE: "TESTE",
  TRABALHO: "TRABALHO",
  ORAL: "ORAL",
  PARTICIPACAO: "PARTICIPACAO",
  PROJECTO: "PROJECTO",
} as const satisfies Record<TipoAvaliacao, TipoAvaliacao>;

const tipoLabels: Record<TipoAvaliacao, string> = {
  TESTE: "Teste",
  TRABALHO: "Trabalho",
  ORAL: "Oral",
  PARTICIPACAO: "Participação",
  PROJECTO: "Projecto",
};

interface Disciplina {
  id: string;
  nome: string;
  cor: string;
}

interface Avaliacao {
  id: string;
  disciplinaId: string;
  nome: string;
  tipo: TipoAvaliacao;
  data: string;
  nota: number | null;
  peso: number;
  observacoes?: string | null;
  disciplina?: Disciplina | null;
  createdAt?: string;
}

interface GradesViewProps {
  avaliacoes: Avaliacao[];
  disciplinas: Disciplina[];
}

type FormState = {
  nome: string;
  disciplinaId: string;
  tipo: TipoAvaliacao;
  data: string;
  nota: string;
  peso: string;
  observacoes: string;
};

const emptyForm: FormState = {
  nome: "",
  disciplinaId: "",
  tipo: TIPO.TESTE,
  data: "",
  nota: "",
  peso: "1",
  observacoes: "",
};

function dateToInput(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function gradeColor(nota: number) {
  if (nota >= 14) return "text-blue-700";
  if (nota >= 10) return "text-orange-600";
  return "text-red-600";
}

function gradeAccent(nota: number) {
  if (nota >= 14) return "#2563EB";
  if (nota >= 10) return "#D97706";
  return "#DC2626";
}

function weightedAverage(items: Avaliacao[]) {
  const graded = items.filter((item) => item.nota !== null);
  const totalPeso = graded.reduce((sum, item) => sum + item.peso, 0);
  if (graded.length === 0 || totalPeso <= 0) return 0;
  const total = graded.reduce((sum, item) => sum + (item.nota ?? 0) * item.peso, 0);
  return Math.round((total / totalPeso) * 10) / 10;
}

function normalizeGrade(item: any): Avaliacao {
  return {
    id: item.id,
    disciplinaId: item.disciplinaId,
    nome: item.nome,
    tipo: item.tipo,
    data: new Date(item.data).toISOString(),
    nota: item.nota ?? null,
    peso: item.peso ?? 1,
    observacoes: item.observacoes ?? null,
    disciplina: item.disciplina ?? null,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
  };
}

function formFromGrade(avaliacao: Avaliacao): FormState {
  return {
    nome: avaliacao.nome,
    disciplinaId: avaliacao.disciplinaId,
    tipo: avaliacao.tipo,
    data: dateToInput(avaliacao.data),
    nota: avaliacao.nota === null ? "" : String(avaliacao.nota),
    peso: String(avaliacao.peso),
    observacoes: avaliacao.observacoes ?? "",
  };
}

function getDisciplineIcon(nome: string) {
  const lower = nome.toLocaleLowerCase("pt-PT");
  if (lower.includes("mat")) return Calculator;
  if (lower.includes("fis")) return FlaskConical;
  if (lower.includes("quim")) return Beaker;
  if (lower.includes("educa")) return Dumbbell;
  if (lower.includes("fil") || lower.includes("hist") || lower.includes("port")) return BookOpen;
  return FileText;
}

export function GradesView({ avaliacoes, disciplinas }: GradesViewProps) {
  const router = useRouter();
  const [localGrades, setLocalGrades] = useState(avaliacoes);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string | null>(null);
  const [editingGrade, setEditingGrade] = useState<Avaliacao | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalGrades(avaliacoes);
  }, [avaliacoes]);

  const graded = useMemo(
    () => localGrades.filter((avaliacao) => avaliacao.nota !== null),
    [localGrades],
  );

  const mediaGlobal = useMemo(() => weightedAverage(localGrades), [localGrades]);

  const escala = useMemo(
    () => ({
      excelente: graded.filter((avaliacao) => (avaliacao.nota ?? 0) >= 14).length,
      suficiente: graded.filter(
        (avaliacao) => (avaliacao.nota ?? 0) >= 10 && (avaliacao.nota ?? 0) < 14,
      ).length,
      insuficiente: graded.filter((avaliacao) => (avaliacao.nota ?? 0) < 10).length,
    }),
    [graded],
  );

  const disciplineCards = useMemo(
    () =>
      disciplinas.map((disciplina) => {
        const items = localGrades.filter((avaliacao) => avaliacao.disciplinaId === disciplina.id);
        return {
          ...disciplina,
          avaliacoes: items,
          media: weightedAverage(items),
          totalNotas: items.filter((avaliacao) => avaliacao.nota !== null).length,
          totalAvaliacoes: items.length,
        };
      }),
    [disciplinas, localGrades],
  );

  const selectedDisciplina =
    disciplineCards.find((disciplina) => disciplina.id === selectedDisciplinaId) ?? null;

  const showFeedback = (message: string) => {
    toast.success(message);
  };

  const openCreate = (disciplinaId?: string) => {
    setEditingGrade(null);
    setError(null);
    setForm({
      ...emptyForm,
      disciplinaId: disciplinaId ?? disciplinas[0]?.id ?? "",
      data: dateToInput(new Date()),
    });
    setModalOpen(true);
  };

  const openEdit = (avaliacao: Avaliacao) => {
    setEditingGrade(avaliacao);
    setError(null);
    setForm(formFromGrade(avaliacao));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGrade(null);
    setError(null);
    setForm(emptyForm);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.nome.trim()) {
      setError("Indica o nome da avaliação.");
      return;
    }
    if (!form.disciplinaId) {
      setError("Escolhe uma disciplina.");
      return;
    }
    if (!form.data) {
      setError("Indica a data da avaliação.");
      return;
    }

    const nota = form.nota.trim() === "" ? null : Number(form.nota);
    if (nota !== null && (Number.isNaN(nota) || nota < 0 || nota > 20)) {
      setError("A nota deve estar entre 0 e 20.");
      return;
    }

    const peso = Number(form.peso || "1");
    if (Number.isNaN(peso) || peso <= 0) {
      setError("O peso deve ser maior que 0.");
      return;
    }

    startTransition(async () => {
      const payload = {
        nome: form.nome,
        disciplinaId: form.disciplinaId,
        tipo: form.tipo,
        data: `${form.data}T12:00:00`,
        nota,
        peso,
        observacoes: form.observacoes,
      };

      const result = editingGrade
        ? await updateGradeAction({ ...payload, avaliacaoId: editingGrade.id })
        : await createGradeAction(payload);

      if (!result.success) {
        setError(result.error || "Não foi possível guardar a nota.");
        return;
      }

      if (result.data) {
        const saved = normalizeGrade(result.data);
        setLocalGrades((current) =>
          editingGrade
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current],
        );
      }

      showFeedback(editingGrade ? "Nota atualizada." : "Nota adicionada.");
      closeModal();
      router.refresh();
    });
  };

  const handleDelete = (avaliacao: Avaliacao) => {
    if (!window.confirm(`Eliminar "${avaliacao.nome}"?`)) return;

    const previous = localGrades;
    setLocalGrades((current) => current.filter((item) => item.id !== avaliacao.id));
    if (editingGrade?.id === avaliacao.id) closeModal();
    showFeedback("Nota eliminada.");

    startTransition(async () => {
      const result = await deleteGradeAction(avaliacao.id);
      if (!result.success) {
        setLocalGrades(previous);
        setError(result.error || "Não foi possível eliminar a nota.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registo de notas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Acompanha o teu progresso académico e médias.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Adicionar nota
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Média global</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className={`text-5xl font-bold ${mediaGlobal >= 10 ? "text-blue-700" : "text-red-600"}`}>
                    {mediaGlobal.toFixed(1)}
                  </span>
                  <span className="pb-2 text-sm text-gray-500">/20</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Baseado em {graded.length} avaliação{graded.length === 1 ? "" : "ões"}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <div className="h-2 rounded-full bg-blue-100">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${Math.min(100, (mediaGlobal / 20) * 100)}%` }}
              />
            </div>
          </section>

          <section className="rounded-xl border border-blue-100 bg-white/70 p-6 shadow-sm">
            <p className="mb-5 text-sm font-semibold text-gray-800">Escala de avaliação</p>
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                <span className="text-gray-600">Excelente / Bom</span>
                <span className="ml-auto font-semibold text-blue-700">≥ 14</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
                <span className="text-gray-600">Suficiente</span>
                <span className="ml-auto font-semibold text-orange-600">10 - 13</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                <span className="text-gray-600">Insuficiente</span>
                <span className="ml-auto font-semibold text-red-600">&lt; 10</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded bg-blue-50 p-2 text-blue-700">{escala.excelente}</div>
              <div className="rounded bg-orange-50 p-2 text-orange-700">{escala.suficiente}</div>
              <div className="rounded bg-red-50 p-2 text-red-700">{escala.insuficiente}</div>
            </div>
          </section>
        </aside>

        <main>
          <h2 className="mb-5 text-base font-semibold text-gray-900">
            Média por disciplina
          </h2>

          {disciplineCards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white/70 p-8 text-center text-sm text-gray-500">
              Cria disciplinas para começares a registar notas.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {disciplineCards.map((disciplina) => {
                const Icon = getDisciplineIcon(disciplina.nome);
                const hasGrade = disciplina.totalNotas > 0;
                return (
                  <article
                    key={disciplina.id}
                    className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                    style={{ borderLeft: `4px solid ${disciplina.cor || "#2563EB"}` }}
                  >
                    <div className="mb-6 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{disciplina.nome}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {disciplina.totalAvaliacoes} avaliação{disciplina.totalAvaliacoes === 1 ? "" : "ões"} registada{disciplina.totalAvaliacoes === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-xs text-gray-500">Média atual</p>
                      <p className={`mt-1 text-3xl font-bold ${hasGrade ? gradeColor(disciplina.media) : "text-gray-400"}`}>
                        {hasGrade ? disciplina.media.toFixed(1) : "-"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedDisciplinaId(disciplina.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
                      >
                        Ver detalhes
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openCreate(disciplina.id)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Adicionar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {selectedDisciplina && (
        <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain px-4 py-8">
          <div
            className="fixed inset-0 bg-black/40"
            role="presentation"
            onClick={() => setSelectedDisciplinaId(null)}
          />
          <div className="relative mx-auto flex w-full max-w-2xl items-start justify-center sm:py-2">
            <section
              role="dialog"
              aria-modal="true"
              className="relative flex max-h-[min(90vh,calc(100vh-48px))] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedDisciplina.nome}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedDisciplina.totalAvaliacoes} avaliação{selectedDisciplina.totalAvaliacoes === 1 ? "" : "ões"} registada{selectedDisciplina.totalAvaliacoes === 1 ? "" : "s"}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDisciplinaId(null)}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {selectedDisciplina.avaliacoes.length === 0 ? (
                  <p className="rounded-lg bg-blue-50 p-4 text-sm text-gray-600">
                    Sem avaliações nesta disciplina.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedDisciplina.avaliacoes.map((avaliacao) => (
                      <div
                        key={avaliacao.id}
                        className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
                        style={{
                          borderLeft: `4px solid ${
                            avaliacao.nota === null ? selectedDisciplina.cor : gradeAccent(avaliacao.nota)
                          }`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{avaliacao.nome}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {tipoLabels[avaliacao.tipo]} · {formatDate(avaliacao.data)} · Peso {avaliacao.peso}
                            </p>
                            {avaliacao.observacoes ? (
                              <p className="mt-2 text-sm text-gray-600">{avaliacao.observacoes}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xl font-bold ${
                                avaliacao.nota === null ? "text-gray-400" : gradeColor(avaliacao.nota)
                              }`}
                            >
                              {avaliacao.nota === null ? "-" : avaliacao.nota.toFixed(1)}
                            </span>
                            <button
                              type="button"
                              onClick={() => openEdit(avaliacao)}
                              className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-700"
                              aria-label="Editar nota"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(avaliacao)}
                              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              aria-label="Eliminar nota"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => openCreate(selectedDisciplina.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar nota
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain px-4 py-8">
          <div className="fixed inset-0 bg-black/40" role="presentation" onClick={closeModal} />
          <div className="relative mx-auto flex w-full max-w-xl items-start justify-center sm:py-2">
            <div
              role="dialog"
              aria-modal="true"
              className="relative flex max-h-[min(90vh,calc(100vh-48px))] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingGrade ? "Editar nota" : "Adicionar nota"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Regista avaliação, disciplina, data, peso e nota.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <form id="grade-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      value={form.nome}
                      onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Ex: Frequência de História"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Disciplina</label>
                      <select
                        value={form.disciplinaId}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, disciplinaId: event.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Escolher disciplina</option>
                        {disciplinas.map((disciplina) => (
                          <option key={disciplina.id} value={disciplina.id}>
                            {disciplina.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
                      <select
                        value={form.tipo}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, tipo: event.target.value as TipoAvaliacao }))
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {Object.entries(tipoLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Data</label>
                      <input
                        type="date"
                        value={form.data}
                        onChange={(event) => setForm((prev) => ({ ...prev, data: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Nota</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={form.nota}
                        onChange={(event) => setForm((prev) => ({ ...prev, nota: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0 - 20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Peso</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={form.peso}
                        onChange={(event) => setForm((prev) => ({ ...prev, peso: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
                    <textarea
                      value={form.observacoes}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, observacoes: event.target.value }))
                      }
                      className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Opcional"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                </form>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {editingGrade ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingGrade)}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="grade-form"
                      disabled={isPending}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {isPending ? "A guardar..." : "Guardar nota"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
