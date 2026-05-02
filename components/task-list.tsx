"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  Edit2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { PrioridadeTarefa, StatusTarefa } from "@prisma/client";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  updateTaskStatusAction,
} from "@/lib/tasks-actions";
import { toast } from "sonner";

const STATUS = {
  PENDENTE: "PENDENTE",
  CONCLUIDA: "CONCLUIDA",
  ATRASADA: "ATRASADA",
} as const satisfies Record<StatusTarefa, StatusTarefa>;

const PRIORIDADE = {
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAIXA: "BAIXA",
} as const satisfies Record<PrioridadeTarefa, PrioridadeTarefa>;

interface Disciplina {
  id: string;
  nome: string;
  cor: string;
}

interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  progresso: number;
  disciplina?: Disciplina | null;
  createdAt?: string;
}

interface TaskListProps {
  tarefas: Tarefa[];
  disciplinas: Disciplina[];
  pendentes: number;
  completas: number;
}

type Filter = "todas" | "hoje" | "semana" | "atrasadas" | "concluidas";
type FormState = {
  titulo: string;
  descricao: string;
  prazoData: string;
  prazoHora: string;
  disciplinaId: string;
  prioridade: PrioridadeTarefa;
  status: StatusTarefa;
  progresso: number;
};

const emptyForm: FormState = {
  titulo: "",
  descricao: "",
  prazoData: "",
  prazoHora: "18:00",
  disciplinaId: "",
  prioridade: PRIORIDADE.MEDIA,
  status: STATUS.PENDENTE,
  progresso: 0,
};

const filterLabels: Record<Filter, string> = {
  todas: "Todas",
  hoje: "Hoje",
  semana: "Esta semana",
  atrasadas: "Atrasadas",
  concluidas: "Concluídas",
};

const priorityLabel: Record<PrioridadeTarefa, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parsePrazo(prazo?: string | null) {
  if (!prazo) return null;
  const date = new Date(prazo);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isOverdue(tarefa: Tarefa) {
  const prazo = parsePrazo(tarefa.prazo);
  if (tarefa.status === STATUS.CONCLUIDA) return false;
  if (tarefa.status === STATUS.ATRASADA) return true;
  if (!prazo) return false;
  return prazo < new Date();
}

function isTodayTask(tarefa: Tarefa) {
  const prazo = parsePrazo(tarefa.prazo);
  if (!prazo) return false;
  return startOfDay(prazo).getTime() === startOfDay(new Date()).getTime();
}

function isThisWeekTask(tarefa: Tarefa) {
  const prazo = parsePrazo(tarefa.prazo);
  if (!prazo) return false;
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  return prazo >= today && prazo <= weekEnd;
}

function dateToInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeToInput(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatPrazo(prazo?: string | null) {
  const date = parsePrazo(prazo);
  if (!date) return "Sem prazo";

  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === -1) return "Ontem";
  if (diffDays < -1) return `Há ${Math.abs(diffDays)} dias`;
  if (diffDays === 1) return "Amanhã";
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("pt-PT", { weekday: "long" }).format(date);
  }

  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function getTaskAccent(tarefa: Tarefa) {
  if (isOverdue(tarefa)) return "#C2410C";
  if (tarefa.status === STATUS.CONCLUIDA) return "#16A34A";
  if (tarefa.disciplina?.cor) return tarefa.disciplina.cor;
  if (tarefa.prioridade === PRIORIDADE.ALTA) return "#F97316";
  return "#2563EB";
}

function formFromTask(tarefa: Tarefa): FormState {
  const prazo = parsePrazo(tarefa.prazo);
  return {
    titulo: tarefa.titulo,
    descricao: tarefa.descricao ?? "",
    prazoData: prazo ? dateToInput(prazo) : "",
    prazoHora: prazo ? timeToInput(prazo) : "18:00",
    disciplinaId: tarefa.disciplina?.id ?? "",
    prioridade: tarefa.prioridade,
    status: tarefa.status,
    progresso: tarefa.progresso,
  };
}

function toPayloadDate(form: FormState) {
  if (!form.prazoData) return null;
  return `${form.prazoData}T${form.prazoHora || "18:00"}:00`;
}

function normalizeTask(task: any): Tarefa {
  return {
    id: task.id,
    titulo: task.titulo,
    descricao: task.descricao ?? null,
    prazo: task.prazo ? new Date(task.prazo).toISOString() : null,
    status: task.status,
    prioridade: task.prioridade,
    progresso: task.progresso ?? 0,
    disciplina: task.disciplina ?? null,
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : undefined,
  };
}

export function TaskList({ tarefas, disciplinas }: TaskListProps) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = useState(tarefas);
  const [filter, setFilter] = useState<Filter>("todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalTasks(tarefas);
  }, [tarefas]);

  const activeTasks = useMemo(
    () => localTasks.filter((t) => t.status !== STATUS.CONCLUIDA),
    [localTasks],
  );
  const completedTasks = useMemo(
    () =>
      localTasks
        .filter((t) => t.status === STATUS.CONCLUIDA)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [localTasks],
  );

  const overdueTasks = useMemo(() => activeTasks.filter(isOverdue), [activeTasks]);
  const todayTasks = useMemo(
    () => activeTasks.filter((t) => !isOverdue(t) && isTodayTask(t)),
    [activeTasks],
  );
  const upcomingTasks = useMemo(
    () => activeTasks.filter((t) => !isOverdue(t) && !isTodayTask(t)),
    [activeTasks],
  );

  const filteredGroups = useMemo(() => {
    if (filter === "hoje") return [{ title: "Hoje", tasks: todayTasks, tone: "today" }];
    if (filter === "semana") {
      return [
        {
          title: "Esta semana",
          tasks: activeTasks.filter((t) => !isOverdue(t) && isThisWeekTask(t)),
          tone: "week",
        },
      ];
    }
    if (filter === "atrasadas") {
      return [{ title: "Atrasadas", tasks: overdueTasks, tone: "late" }];
    }
    if (filter === "concluidas") {
      return [{ title: "Concluídas", tasks: completedTasks, tone: "done" }];
    }

    return [
      { title: "Atrasadas", tasks: overdueTasks, tone: "late" },
      { title: "Hoje", tasks: todayTasks, tone: "today" },
      { title: "Próximos dias", tasks: upcomingTasks, tone: "upcoming" },
      { title: "Concluídas", tasks: completedTasks.slice(0, 6), tone: "done" },
    ];
  }, [activeTasks, completedTasks, filter, overdueTasks, todayTasks, upcomingTasks]);

  const weeklyTotal = localTasks.filter(isThisWeekTask).length;
  const weeklyDone = localTasks.filter(
    (t) => isThisWeekTask(t) && t.status === STATUS.CONCLUIDA,
  ).length;
  const weeklyPercent = weeklyTotal > 0 ? Math.round((weeklyDone / weeklyTotal) * 100) : 0;
  const pendentesCount = localTasks.filter((t) => t.status !== STATUS.CONCLUIDA).length;
  const completasCount = completedTasks.length;

  const nextDeadlines = activeTasks
    .filter((t) => parsePrazo(t.prazo))
    .sort((a, b) => parsePrazo(a.prazo)!.getTime() - parsePrazo(b.prazo)!.getTime())
    .slice(0, 3);

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (tarefa: Tarefa) => {
    setEditingTask(tarefa);
    setForm(formFromTask(tarefa));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setForm(emptyForm);
  };

  const refresh = () => router.refresh();

  const showFeedback = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.titulo.trim()) {
      showError("Indica o título da tarefa.");
      return;
    }

    startTransition(async () => {
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao,
        prazo: toPayloadDate(form),
        disciplinaId: form.disciplinaId || null,
        prioridade: form.prioridade,
        status: form.status,
        progresso: form.progresso,
      };

      const result = editingTask
        ? await updateTaskAction({ ...payload, tarefaId: editingTask.id })
        : await createTaskAction(payload);

      if (!result.success) {
        showError(result.error || "Não foi possível guardar a tarefa.");
        return;
      }

      if (result.data) {
        const savedTask = normalizeTask(result.data);
        setLocalTasks((current) =>
          editingTask
            ? current.map((task) => (task.id === savedTask.id ? savedTask : task))
            : [savedTask, ...current],
        );
      }
      showFeedback(editingTask ? "Tarefa atualizada." : "Tarefa criada.");
      closeModal();
      refresh();
    });
  };

  const handleToggle = (tarefa: Tarefa) => {
    const previousTasks = localTasks;
    const nextStatus =
      tarefa.status === STATUS.CONCLUIDA
        ? STATUS.PENDENTE
        : STATUS.CONCLUIDA;

    setLocalTasks((current) =>
      current.map((task) =>
        task.id === tarefa.id
          ? {
              ...task,
              status: nextStatus,
              progresso: nextStatus === STATUS.CONCLUIDA ? 100 : task.progresso,
            }
          : task,
      ),
    );
    showFeedback(nextStatus === STATUS.CONCLUIDA ? "Tarefa concluída." : "Tarefa reaberta.");

    startTransition(async () => {
      const result = await updateTaskStatusAction(tarefa.id, nextStatus);
      if (!result.success) {
        setLocalTasks(previousTasks);
        showError(result.error || "Não foi possível atualizar a tarefa.");
        return;
      }
      refresh();
    });
  };

  const handleDelete = (tarefa: Tarefa) => {
    if (!window.confirm(`Eliminar "${tarefa.titulo}"?`)) return;

    const previousTasks = localTasks;
    setLocalTasks((current) => current.filter((task) => task.id !== tarefa.id));
    showFeedback("Tarefa eliminada.");
    if (editingTask?.id === tarefa.id) closeModal();

    startTransition(async () => {
      const result = await deleteTaskAction(tarefa.id);
      if (!result.success) {
        setLocalTasks(previousTasks);
        showError(result.error || "Não foi possível eliminar a tarefa.");
        return;
      }
      refresh();
    });
  };

  const renderTask = (tarefa: Tarefa) => {
    const accent = getTaskAccent(tarefa);
    const done = tarefa.status === STATUS.CONCLUIDA;

    return (
      <article
        key={tarefa.id}
        className={`group rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md ${done ? "opacity-70" : ""}`}
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => handleToggle(tarefa)}
            disabled={isPending}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
              done ? "border-green-600 bg-green-600 text-white" : "border-gray-300 hover:border-blue-600"
            }`}
            aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
          >
            {done && <Check className="h-3.5 w-3.5" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => openEdit(tarefa)}
                className="min-w-0 text-left"
              >
                <h3
                  className={`font-medium leading-5 ${done ? "text-gray-500 line-through" : "text-gray-900"}`}
                >
                  {tarefa.titulo}
                </h3>
                {tarefa.descricao ? (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{tarefa.descricao}</p>
                ) : null}
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={`rounded px-2 py-1 text-[11px] font-medium ${
                    isOverdue(tarefa)
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {formatPrazo(tarefa.prazo)}
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(tarefa)}
                  className="rounded p-1.5 text-gray-400 opacity-0 transition hover:bg-blue-50 hover:text-blue-700 group-hover:opacity-100"
                  aria-label="Editar tarefa"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tarefa)}
                  className="rounded p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  aria-label="Eliminar tarefa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tarefa.disciplina ? (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: tarefa.disciplina.cor }}
                  />
                  {tarefa.disciplina.nome}
                </span>
              ) : null}
              <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
                {priorityLabel[tarefa.prioridade]}
              </span>
              {tarefa.progresso > 0 && !done ? (
                <span className="rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                  {tarefa.progresso}% feito
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Tarefas e TPC</h1>
          <p className="mt-2 text-sm text-gray-600">
            Organize o seu estudo com clareza.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 border-b border-blue-100 pb-5">
        {(Object.keys(filterLabels) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === key
                ? "bg-blue-600 text-white"
                : key === "atrasadas"
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : key === "concluidas"
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-blue-100 text-gray-700 hover:bg-blue-200"
            }`}
          >
            {key === "atrasadas" && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
            {key === "concluidas" && <Check className="mr-1 inline h-3.5 w-3.5" />}
            {filterLabels[key]}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
        <main className="space-y-8">
          {filteredGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div className="flex items-center gap-2">
                {group.tone === "late" ? (
                  <AlertTriangle className="h-4 w-4 text-orange-700" />
                ) : null}
                <h2 className="text-base font-semibold text-gray-800">{group.title}</h2>
                {group.tone === "late" && group.tasks.length > 0 ? (
                  <span className="rounded-full bg-orange-700 px-2 py-0.5 text-xs font-semibold text-white">
                    {group.tasks.length}
                  </span>
                ) : null}
              </div>

              {group.tasks.length > 0 ? (
                <div className="space-y-3">{group.tasks.map(renderTask)}</div>
              ) : (
                <div className="rounded-lg border border-dashed border-blue-200 bg-white/60 px-4 py-6 text-sm text-gray-500">
                  Sem tarefas nesta secção.
                </div>
              )}
            </section>
          ))}
        </main>

        <aside className="space-y-6">
          <section className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">Progresso da Semana</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-bold text-blue-700">{weeklyDone}</span>
              <span className="pb-1 text-sm text-gray-600">tarefas concluídas</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/80">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${weeklyPercent}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-gray-600">
              {weeklyPercent}% das metas semanais
            </p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                Próximos prazos
              </h2>
            </div>
            <div className="space-y-3">
              {nextDeadlines.length > 0 ? (
                nextDeadlines.map((tarefa) => {
                  const prazo = parsePrazo(tarefa.prazo)!;
                  return (
                    <button
                      key={tarefa.id}
                      type="button"
                      onClick={() => openEdit(tarefa)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-blue-50"
                    >
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded bg-blue-100 text-[10px] font-bold uppercase text-blue-700">
                        <span>{prazo.toLocaleDateString("pt-PT", { day: "2-digit" })}</span>
                        <span>{prazo.toLocaleDateString("pt-PT", { month: "short" })}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{tarefa.titulo}</p>
                        <p className="text-xs text-gray-500">{formatPrazo(tarefa.prazo)}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">Sem prazos marcados.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">Resumo</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-2xl font-bold text-gray-900">{pendentesCount}</p>
                <p className="text-xs text-gray-500">Pendentes</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-2xl font-bold text-green-700">{completasCount}</p>
                <p className="text-xs text-gray-500">Concluídas</p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain px-4 py-8">
          <div
            className="fixed inset-0 bg-black/40"
            role="presentation"
            onClick={closeModal}
          />
          <div className="relative mx-auto flex w-full max-w-xl items-start justify-center sm:py-2">
            <div
              role="dialog"
              aria-modal="true"
              className="relative flex max-h-[min(90vh,calc(100vh-48px))] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingTask ? "Editar tarefa" : "Nova tarefa"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Defina prazo, disciplina, prioridade e progresso.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
                <input
                  value={form.titulo}
                  onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Ex: Ficha de exercícios de Álgebra"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                  className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Notas, capítulos, links ou detalhes do TPC..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Data</label>
                  <input
                    type="date"
                    value={form.prazoData}
                    onChange={(event) => setForm((prev) => ({ ...prev, prazoData: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hora</label>
                  <input
                    type="time"
                    value={form.prazoHora}
                    onChange={(event) => setForm((prev) => ({ ...prev, prazoHora: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Disciplina</label>
                  <select
                    value={form.disciplinaId}
                    onChange={(event) => setForm((prev) => ({ ...prev, disciplinaId: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Sem disciplina</option>
                    {disciplinas.map((disciplina) => (
                      <option key={disciplina.id} value={disciplina.id}>
                        {disciplina.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        prioridade: event.target.value as PrioridadeTarefa,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value={PRIORIDADE.ALTA}>Alta</option>
                    <option value={PRIORIDADE.MEDIA}>Média</option>
                    <option value={PRIORIDADE.BAIXA}>Baixa</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        status: event.target.value as StatusTarefa,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value={STATUS.PENDENTE}>Pendente</option>
                    <option value={STATUS.ATRASADA}>Atrasada</option>
                    <option value={STATUS.CONCLUIDA}>Concluída</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center justify-between text-sm font-medium text-gray-700">
                    Progresso <span className="text-gray-500">{form.progresso}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.progresso}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, progresso: Number(event.target.value) }))
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

                </form>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingTask)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
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
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="task-form"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Clock3 className="h-4 w-4 animate-spin" />
                        A guardar...
                      </>
                    ) : (
                      "Guardar tarefa"
                    )}
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
