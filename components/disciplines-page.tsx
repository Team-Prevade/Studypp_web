"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createDisciplineAction,
  deleteDisciplineAction,
  updateDisciplineAction,
} from "@/lib/disciplines-actions";
import { toast } from "sonner";

type MiniAula = {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  sala?: string | null;
  professor?: string | null;
  repetir: string;
};

type MiniTarefa = {
  id: string;
  titulo: string;
  prazo?: string | null;
  prioridade: string;
  status: string;
  progresso: number;
};

type MiniAvaliacao = {
  id: string;
  nome: string;
  tipo: string;
  data: string;
  nota?: number | null;
  peso: number;
};

type MiniApontamento = {
  id: string;
  titulo: string;
  fixado: boolean;
  updatedAt: string;
};

type MiniSessao = {
  id: string;
  tipo: string;
  duracaoPrevista: number;
  duracaoReal?: number | null;
  status: string;
  iniciadaEm: string;
  terminadaEm?: string | null;
};

type MiniEvento = {
  id: string;
  titulo: string;
  tipo: string;
  dataInicio: string;
  dataFim?: string | null;
};

export interface DisciplinaStats {
  id: string;
  nome: string;
  cor: string;
  professor?: string | null;
  sala?: string | null;
  notas?: string | null;
  ordem: number;
  ativo: boolean;
  totalAulas: number;
  totalTarefas: number;
  tarefasConcluidas: number;
  totalAvaliacoes: number;
  mediaAvaliacoes: number;
  totalTestes: number;
  totalHorasEstudo: number;
  totalApontamentos: number;
  totalEventos: number;
  aulas: MiniAula[];
  tarefas: MiniTarefa[];
  avaliacoes: MiniAvaliacao[];
  apontamentos: MiniApontamento[];
  sessoesEstudo: MiniSessao[];
  eventos: MiniEvento[];
}

interface DisciplinesPageProps {
  disciplinas: DisciplinaStats[];
}

type FormState = {
  nome: string;
  professor: string;
  sala: string;
  notas: string;
  cor: string;
  ordem: number;
  ativo: boolean;
};

const emptyForm: FormState = {
  nome: "",
  professor: "",
  sala: "",
  notas: "",
  cor: "#2563EB",
  ordem: 0,
  ativo: true,
};

const colorPalette = [
  "#2563EB",
  "#1E40AF",
  "#0D9488",
  "#7C3AED",
  "#D97706",
  "#DC2626",
  "#4B5563",
];

function formFromDiscipline(disciplina: DisciplinaStats): FormState {
  return {
    nome: disciplina.nome,
    professor: disciplina.professor ?? "",
    sala: disciplina.sala ?? "",
    notas: disciplina.notas ?? "",
    cor: disciplina.cor,
    ordem: disciplina.ordem ?? 0,
    ativo: disciplina.ativo,
  };
}

function normalizeDiscipline(input: any): DisciplinaStats {
  return {
    ...input,
    professor: input.professor ?? null,
    sala: input.sala ?? null,
    notas: input.notas ?? null,
    aulas: input.aulas ?? [],
    tarefas: (input.tarefas ?? []).map((item: any) => ({
      ...item,
      prazo: item.prazo ? new Date(item.prazo).toISOString() : null,
    })),
    avaliacoes: (input.avaliacoes ?? []).map((item: any) => ({
      ...item,
      data: new Date(item.data).toISOString(),
    })),
    apontamentos: (input.apontamentos ?? []).map((item: any) => ({
      ...item,
      updatedAt: new Date(item.updatedAt).toISOString(),
    })),
    sessoesEstudo: (input.sessoesEstudo ?? []).map((item: any) => ({
      ...item,
      iniciadaEm: new Date(item.iniciadaEm).toISOString(),
      terminadaEm: item.terminadaEm ? new Date(item.terminadaEm).toISOString() : null,
    })),
    eventos: (input.eventos ?? []).map((item: any) => ({
      ...item,
      dataInicio: new Date(item.dataInicio).toISOString(),
      dataFim: item.dataFim ? new Date(item.dataFim).toISOString() : null,
    })),
  };
}

function gradeColor(media: number) {
  if (media >= 14) return "text-blue-700";
  if (media >= 10) return "text-orange-600";
  if (media > 0) return "text-red-600";
  return "text-gray-400";
}

export function DisciplinesPage({ disciplinas }: DisciplinesPageProps) {
  const router = useRouter();
  const [items, setItems] = useState(disciplinas);
  const [expandedId, setExpandedId] = useState<string | null>(disciplinas[0]?.id ?? null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DisciplinaStats | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DisciplinaStats | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteText, setDeleteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(disciplinas);
  }, [disciplinas]);

  const totals = useMemo(
    () => ({
      disciplinas: items.length,
      aulas: items.reduce((sum, item) => sum + item.totalAulas, 0),
      tarefas: items.reduce((sum, item) => sum + item.totalTarefas, 0),
      horas: items.reduce((sum, item) => sum + item.totalHorasEstudo, 0),
    }),
    [items],
  );

  const showFeedback = (message: string) => {
    toast.success(message);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, ordem: items.length });
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (disciplina: DisciplinaStats) => {
    setEditing(disciplina);
    setForm(formFromDiscipline(disciplina));
    setError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setError(null);
    setForm(emptyForm);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nome.trim()) {
      setError("Indica o nome da disciplina.");
      return;
    }

    startTransition(async () => {
      const payload = {
        nome: form.nome,
        professor: form.professor,
        sala: form.sala,
        notas: form.notas,
        cor: form.cor,
        ordem: form.ordem,
        ativo: form.ativo,
      };

      const result = editing
        ? await updateDisciplineAction(editing.id, payload)
        : await createDisciplineAction(payload);

      if (!result.success) {
        setError(result.error || "Não foi possível guardar a disciplina.");
        return;
      }

      if (result.data) {
        const saved = normalizeDiscipline(result.data);
        setItems((current) =>
          editing
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [...current, saved],
        );
        setExpandedId(saved.id);
      }

      showFeedback(editing ? "Disciplina atualizada." : "Disciplina criada.");
      closeForm();
      router.refresh();
    });
  };

  const requestDelete = (disciplina: DisciplinaStats) => {
    setConfirmDelete(disciplina);
    setDeleteText("");
    setError(null);
  };

  const handleDelete = () => {
    if (!confirmDelete || deleteText !== confirmDelete.nome) return;
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== confirmDelete.id));
    setConfirmDelete(null);
    showFeedback("Disciplina eliminada.");

    startTransition(async () => {
      const result = await deleteDisciplineAction(confirmDelete.id);
      if (!result.success) {
        setItems(previous);
        setError(result.error || "Não foi possível eliminar a disciplina.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suas disciplinas</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            Gerencie suas matérias, acompanhe seu desempenho e mantenha seu foco académico alinhado.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nova disciplina
        </button>
      </div>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Disciplinas" value={totals.disciplinas} />
        <StatCard label="Aulas" value={totals.aulas} tone="blue" />
        <StatCard label="Tarefas" value={totals.tarefas} tone="blue" />
        <StatCard label="Horas estudo" value={`${totals.horas.toFixed(1)}h`} tone="blue" />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-blue-200 bg-white/70 p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-blue-300" />
          <p className="text-gray-600">Ainda não há disciplinas. Crie a primeira no botão superior.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((disciplina) => {
            const expanded = expandedId === disciplina.id;
            return (
              <article key={disciplina.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : disciplina.id)}
                  className="w-full px-6 py-5 text-left transition hover:bg-blue-50/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: disciplina.cor }}
                      />
                      <div className="min-w-0">
                        <h2 className="font-bold text-gray-900">{disciplina.nome}</h2>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {disciplina.professor ? <span>Prof. {disciplina.professor}</span> : null}
                          {disciplina.sala ? <span>Sala {disciplina.sala}</span> : null}
                          {!disciplina.ativo ? <span className="font-semibold text-orange-600">Inativa</span> : null}
                        </div>
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-gray-100 px-6 py-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Tarefas concl." value={`${disciplina.tarefasConcluidas}/${disciplina.totalTarefas}`} />
                      <MetricCard icon={<BarChart3 className="h-5 w-5" />} label="Média atual" value={disciplina.mediaAvaliacoes > 0 ? disciplina.mediaAvaliacoes.toFixed(1) : "-"} valueClass={gradeColor(disciplina.mediaAvaliacoes)} />
                      <MetricCard icon={<Clock3 className="h-5 w-5" />} label="Horas estudo" value={`${disciplina.totalHorasEstudo}h`} />
                    </div>
                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/disciplinas/${disciplina.id}`)}
                        className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Ver detalhes
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(disciplina)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(disciplina)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Apagar
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain px-4 py-8">
          <div className="fixed inset-0 bg-black/40" role="presentation" onClick={closeForm} />
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
                    {editing ? "Editar disciplina" : "Nova disciplina"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">Dados principais, cor e notas internas.</p>
                </div>
                <button type="button" onClick={closeForm} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <form id="discipline-form" onSubmit={handleSubmit} className="space-y-4">
                  <TextField label="Nome da disciplina" value={form.nome} placeholder="Ex: Sistemas Operativos" onChange={(nome) => setForm((prev) => ({ ...prev, nome }))} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Professor responsável" value={form.professor} placeholder="Ex: Dra. Marta Costa" onChange={(professor) => setForm((prev) => ({ ...prev, professor }))} />
                    <TextField label="Sala/Laboratório" value={form.sala} placeholder="Ex: Lab F3" onChange={(sala) => setForm((prev) => ({ ...prev, sala }))} />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Cor identificadora</label>
                    <div className="flex flex-wrap gap-2">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, cor: color }))}
                          className={`h-9 w-9 rounded-full transition ${
                            form.cor === color ? "ring-2 ring-blue-600 ring-offset-2" : ""
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Escolher cor ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Ordem</label>
                      <input
                        type="number"
                        value={form.ordem}
                        onChange={(event) => setForm((prev) => ({ ...prev, ordem: Number(event.target.value) }))}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.ativo}
                        onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.checked }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      Disciplina activa
                    </label>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Notas internas</label>
                    <textarea
                      value={form.notas}
                      onChange={(event) => setForm((prev) => ({ ...prev, notas: event.target.value }))}
                      placeholder="Objectivos, regras, materiais ou observações..."
                      className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                </form>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="discipline-form"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isPending ? "A guardar..." : "Guardar disciplina"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" role="presentation" onClick={() => setConfirmDelete(null)} />
          <section className="relative w-full max-w-lg rounded-xl border border-red-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Apagar disciplina?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Esta acção é sensível. Aulas e avaliações associadas podem ser removidas, enquanto algumas entidades podem ficar sem disciplina.
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">{confirmDelete.nome}</p>
              <p className="mt-1">
                {confirmDelete.totalAulas} aulas · {confirmDelete.totalAvaliacoes} avaliações · {confirmDelete.totalTarefas} tarefas · {confirmDelete.totalApontamentos} apontamentos
              </p>
            </div>

            <label className="mb-1 block text-sm font-medium text-gray-700">
              Escreva o nome da disciplina para confirmar
            </label>
            <input
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-red-500"
              placeholder={confirmDelete.nome}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteText !== confirmDelete.nome || isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apagar definitivamente
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "blue" }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "blue" ? "text-blue-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  valueClass = "text-gray-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg bg-blue-50 p-4 text-center">
      <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center text-blue-700">{icon}</div>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>
  );
}
