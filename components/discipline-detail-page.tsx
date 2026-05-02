"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Children, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit2,
  FileText,
  GraduationCap,
  NotebookPen,
  Play,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteDisciplineAction,
  updateDisciplineAction,
} from "@/lib/disciplines-actions";
import { toast } from "sonner";
import type { DisciplinaStats } from "@/components/disciplines-page";

type FormState = {
  nome: string;
  professor: string;
  sala: string;
  notas: string;
  cor: string;
  ordem: number;
  ativo: boolean;
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

const dayLabels: Record<string, string> = {
  SEGUNDA: "Segunda",
  TERCA: "Terça",
  QUARTA: "Quarta",
  QUINTA: "Quinta",
  SEXTA: "Sexta",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_PROGRESSO: "Em progresso",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const actionLinks = [
  {
    href: "/notas",
    label: "Adicionar nota",
    detail: "Registar avaliações e médias",
    icon: GraduationCap,
  },
  {
    href: "/tarefas",
    label: "Nova tarefa",
    detail: "Criar trabalhos, TPC e prazos",
    icon: CheckCircle2,
  },
  {
    href: "/horario",
    label: "Adicionar aula",
    detail: "Organizar horários da semana",
    icon: CalendarDays,
  },
  {
    href: "/apontamentos",
    label: "Novo apontamento",
    detail: "Guardar resumos e materiais",
    icon: NotebookPen,
  },
  {
    href: "/calendario",
    label: "Novo evento",
    detail: "Marcar testes, entregas e revisões",
    icon: BookOpen,
  },
  {
    href: "/temporizador",
    label: "Iniciar estudo",
    detail: "Registar uma sessão focada",
    icon: Play,
  },
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

function formatDate(value?: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function gradeColor(media: number) {
  if (media >= 14) return "text-blue-700";
  if (media >= 10) return "text-orange-600";
  if (media > 0) return "text-red-600";
  return "text-gray-400";
}

export function DisciplineDetailPage({ disciplina }: { disciplina: DisciplinaStats }) {
  const router = useRouter();
  const [current, setCurrent] = useState(disciplina);
  const [form, setForm] = useState<FormState>(() => formFromDiscipline(disciplina));
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const progress = useMemo(() => {
    if (current.totalTarefas === 0) return 0;
    return Math.round((current.tarefasConcluidas / current.totalTarefas) * 100);
  }, [current.tarefasConcluidas, current.totalTarefas]);

  const closeEdit = () => {
    setEditing(false);
    setForm(formFromDiscipline(current));
    setError(null);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nome.trim()) {
      setError("Indica o nome da disciplina.");
      return;
    }

    startTransition(async () => {
      const result = await updateDisciplineAction(current.id, form);
      if (!result.success || !result.data) {
        setError(result.error || "Não foi possível atualizar a disciplina.");
        return;
      }

      setCurrent(result.data as DisciplinaStats);
      toast.success("Disciplina atualizada.");
      setEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (deleteText !== current.nome) return;

    startTransition(async () => {
      const result = await deleteDisciplineAction(current.id);
      if (!result.success) {
        setError(result.error || "Não foi possível eliminar a disciplina.");
        return;
      }

      router.push("/disciplinas");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/disciplinas" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4" />
            Voltar às disciplinas
          </Link>
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: current.cor }} />
            <h1 className="text-3xl font-bold text-gray-900">{current.nome}</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {current.professor ? `Prof. ${current.professor}` : "Sem professor"} · {current.sala ? `Sala ${current.sala}` : "Sem sala"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Apagar
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Média atual" value={current.mediaAvaliacoes > 0 ? current.mediaAvaliacoes.toFixed(1) : "-"} valueClass={gradeColor(current.mediaAvaliacoes)} />
        <StatCard label="Tarefas concluídas" value={`${current.tarefasConcluidas}/${current.totalTarefas}`} />
        <StatCard label="Aulas registadas" value={current.totalAulas} />
        <StatCard label="Horas de estudo" value={`${current.totalHorasEstudo}h`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-gray-900">Progresso da disciplina</h2>
                <p className="text-sm text-gray-500">{progress}% das tarefas associadas já estão concluídas.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </section>

          {current.notas ? (
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-bold text-gray-900">Notas internas</h2>
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{current.notas}</p>
            </section>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <InfoList title="Avaliações e notas" icon={<BarChart3 className="h-4 w-4" />} empty="Sem avaliações registadas.">
              {current.avaliacoes.map((avaliacao) => (
                <div key={avaliacao.id} className="flex items-center justify-between rounded-lg bg-blue-50 p-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{avaliacao.nome}</p>
                    <p className="mt-1 text-xs text-gray-500">{avaliacao.tipo} · {formatDate(avaliacao.data)} · peso {avaliacao.peso}</p>
                  </div>
                  <span className={`font-bold ${avaliacao.nota == null ? "text-gray-400" : gradeColor(avaliacao.nota)}`}>
                    {avaliacao.nota == null ? "-" : avaliacao.nota.toFixed(1)}
                  </span>
                </div>
              ))}
            </InfoList>

            <InfoList title="Tarefas" icon={<CheckCircle2 className="h-4 w-4" />} empty="Sem tarefas associadas.">
              {current.tarefas.map((tarefa) => (
                <div key={tarefa.id} className="rounded-lg bg-blue-50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900">{tarefa.titulo}</p>
                    <span className="text-xs font-medium text-blue-700">{tarefa.progresso}%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{statusLabels[tarefa.status] ?? tarefa.status} · {formatDate(tarefa.prazo)}</p>
                </div>
              ))}
            </InfoList>

            <InfoList title="Aulas" icon={<CalendarDays className="h-4 w-4" />} empty="Sem aulas registadas.">
              {current.aulas.map((aula) => (
                <div key={aula.id} className="rounded-lg bg-blue-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">
                    {dayLabels[aula.diaSemana] ?? aula.diaSemana} · {aula.horaInicio} - {aula.horaFim}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{aula.sala ? `Sala ${aula.sala}` : "Sem sala"} · {aula.repetir}</p>
                </div>
              ))}
            </InfoList>

            <InfoList title="Apontamentos e eventos" icon={<FileText className="h-4 w-4" />} empty="Sem apontamentos ou eventos.">
              {current.apontamentos.map((apontamento) => (
                <div key={apontamento.id} className="rounded-lg bg-blue-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">{apontamento.titulo}</p>
                  <p className="mt-1 text-xs text-gray-500">Atualizado {formatDate(apontamento.updatedAt)}</p>
                </div>
              ))}
              {current.eventos.map((evento) => (
                <div key={evento.id} className="rounded-lg bg-blue-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">{evento.titulo}</p>
                  <p className="mt-1 text-xs text-gray-500">{evento.tipo} · {formatDate(evento.dataInicio)}</p>
                </div>
              ))}
            </InfoList>

            <InfoList title="Sessões de estudo" icon={<Clock3 className="h-4 w-4" />} empty="Sem sessões de estudo registadas.">
              {current.sessoesEstudo.map((sessao) => (
                <div key={sessao.id} className="rounded-lg bg-blue-50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900">{sessao.tipo}</p>
                    <span className="text-xs font-medium text-blue-700">
                      {Math.round((sessao.duracaoReal ?? sessao.duracaoPrevista) / 60)}h
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{sessao.status} · {formatDate(sessao.iniciadaEm)}</p>
                </div>
              ))}
            </InfoList>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900">Ações rápidas</h2>
            <div className="space-y-3">
              {actionLinks.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={`${action.href}?disciplinaId=${current.id}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-blue-50/60 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{action.label}</span>
                      <span className="block text-xs text-gray-500">{action.detail}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900">Resumo</h2>
            <div className="space-y-3 text-sm">
              <SummaryLine label="Avaliações" value={current.totalAvaliacoes} />
              <SummaryLine label="Testes" value={current.totalTestes} />
              <SummaryLine label="Apontamentos" value={current.totalApontamentos} />
              <SummaryLine label="Eventos" value={current.totalEventos} />
              <SummaryLine label="Estado" value={current.ativo ? "Activa" : "Inativa"} />
            </div>
          </section>
        </aside>
      </div>

      {editing ? (
        <EditPanel
          form={form}
          setForm={setForm}
          isPending={isPending}
          onClose={closeEdit}
          onSubmit={handleSave}
        />
      ) : null}

      {confirmDelete ? (
        <DeletePanel
          disciplina={current}
          deleteText={deleteText}
          setDeleteText={setDeleteText}
          isPending={isPending}
          onClose={() => setConfirmDelete(false)}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-blue-700",
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function InfoList({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const hasItems = items.length > 0;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-blue-700">
        {icon}
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-3">
        {hasItems ? items : <p className="text-sm text-gray-500">{empty}</p>}
      </div>
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function EditPanel({
  form,
  setForm,
  isPending,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain px-4 py-8">
      <div className="fixed inset-0 bg-black/40" role="presentation" onClick={onClose} />
      <div className="relative mx-auto flex w-full max-w-xl items-start justify-center sm:py-2">
        <div
          role="dialog"
          aria-modal="true"
          className="relative flex max-h-[min(90vh,calc(100vh-48px))] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Editar disciplina</h2>
              <p className="mt-1 text-sm text-gray-600">Atualize os dados principais e notas internas.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <form id="discipline-detail-form" onSubmit={onSubmit} className="space-y-4">
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
            </form>
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="discipline-detail-form"
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
  );
}

function DeletePanel({
  disciplina,
  deleteText,
  setDeleteText,
  isPending,
  onClose,
  onDelete,
}: {
  disciplina: DisciplinaStats;
  deleteText: string;
  setDeleteText: (value: string) => void;
  isPending: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" role="presentation" onClick={onClose} />
      <section className="relative w-full max-w-lg rounded-xl border border-red-100 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Apagar disciplina?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Esta disciplina é uma entidade central. Confirme apenas se pretende removê-la com os seus dados dependentes.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{disciplina.nome}</p>
          <p className="mt-1">
            {disciplina.totalAulas} aulas · {disciplina.totalAvaliacoes} avaliações · {disciplina.totalTarefas} tarefas · {disciplina.totalApontamentos} apontamentos
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-700">
          Escreva o nome da disciplina para confirmar
        </label>
        <input
          value={deleteText}
          onChange={(event) => setDeleteText(event.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-red-500"
          placeholder={disciplina.nome}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteText !== disciplina.nome || isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apagar definitivamente
          </button>
        </div>
      </section>
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
