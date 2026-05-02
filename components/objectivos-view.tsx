"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Save,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  addSubtarefaAction,
  createObjectivoAction,
  deleteObjectivoAction,
  deleteSubtarefaAction,
  markHabitTodayAction,
  toggleSubtarefaAction,
  updateObjectivoAction,
  updateObjectivoStatusAction,
} from "@/lib/objectivos-actions";
import { toast } from "sonner";

interface SubTarefa {
  id: string;
  titulo: string;
  concluida: boolean;
  concluidaEm?: string | null;
  ordem?: number;
  createdAt?: string;
}

interface Objectivo {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria: string;
  status: string;
  prazo?: string | null;
  concluidoEm?: string | null;
  progresso: number;
  concluidas: number;
  totalSubtarefas: number;
  subTarefas: SubTarefa[];
}

interface ObjectivosViewProps {
  objectivos: Objectivo[];
  onTrackPercentage: number;
  activeCount: number;
  completedCount: number;
}

type Filter = "TODOS" | "ACADEMICO" | "PESSOAL" | "HABITO";

type FormState = {
  titulo: string;
  descricao: string;
  categoria: string;
  prazo: string;
};

const emptyForm: FormState = {
  titulo: "",
  descricao: "",
  categoria: "ACADEMICO",
  prazo: "",
};

const categoryMeta: Record<string, { label: string; dot: string; badge: string; border: string }> = {
  ACADEMICO: {
    label: "Académico",
    dot: "bg-blue-700",
    badge: "bg-blue-100 text-blue-700",
    border: "#2563EB",
  },
  PESSOAL: {
    label: "Pessoal",
    dot: "bg-amber-700",
    badge: "bg-amber-100 text-amber-800",
    border: "#B45309",
  },
  HABITO: {
    label: "Hábito",
    dot: "bg-slate-500",
    badge: "bg-slate-100 text-slate-700",
    border: "#64748B",
  },
};

function normalizeObjectivo(input: any): Objectivo {
  const subTarefas = (input.subTarefas ?? []).map((subtarefa: any) => ({
    ...subtarefa,
    concluidaEm: subtarefa.concluidaEm ? new Date(subtarefa.concluidaEm).toISOString() : null,
    createdAt: subtarefa.createdAt ? new Date(subtarefa.createdAt).toISOString() : undefined,
  }));
  const concluidas = subTarefas.filter((subtarefa: SubTarefa) => subtarefa.concluida).length;
  const totalSubtarefas = subTarefas.length;
  const progresso = totalSubtarefas > 0 ? Math.round((concluidas / totalSubtarefas) * 100) : input.progresso ?? 0;

  return {
    ...input,
    descricao: input.descricao ?? "",
    prazo: input.prazo ? new Date(input.prazo).toISOString() : null,
    concluidoEm: input.concluidoEm ? new Date(input.concluidoEm).toISOString() : null,
    subTarefas,
    concluidas,
    totalSubtarefas,
    progresso,
  };
}

function formFromObjectivo(objectivo: Objectivo): FormState {
  return {
    titulo: objectivo.titulo,
    descricao: objectivo.descricao ?? "",
    categoria: objectivo.categoria,
    prazo: objectivo.prazo ? objectivo.prazo.slice(0, 10) : "",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function sortGoals(goals: Objectivo[]) {
  return [...goals].sort((a, b) => {
    if (a.status !== b.status) return a.status === "ACTIVO" ? -1 : 1;
    const aDate = a.prazo ? new Date(a.prazo).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.prazo ? new Date(b.prazo).getTime() : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
}

function dateKey(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function isToday(value?: string | null) {
  return dateKey(value) === new Date().toISOString().slice(0, 10);
}

function getHabitLogs(objectivo: Objectivo) {
  return objectivo.subTarefas.filter((subtarefa) => subtarefa.concluida);
}

function getHabitStreak(objectivo: Objectivo) {
  const completedDays = new Set(
    getHabitLogs(objectivo)
      .map((subtarefa) => dateKey(subtarefa.concluidaEm || subtarefa.createdAt))
      .filter(Boolean),
  );
  let streak = 0;
  const cursor = new Date();

  while (completedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function isHabitDoneToday(objectivo: Objectivo) {
  return objectivo.subTarefas.some(
    (subtarefa) =>
      subtarefa.concluida &&
      isToday(subtarefa.concluidaEm || subtarefa.createdAt),
  );
}

export function ObjectivosView({
  objectivos,
  onTrackPercentage,
  activeCount,
  completedCount,
}: ObjectivosViewProps) {
  const [items, setItems] = useState(() => sortGoals(objectivos.map(normalizeObjectivo)));
  const [filter, setFilter] = useState<Filter>("TODOS");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Objectivo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newSubtask, setNewSubtask] = useState<Record<string, string>>({});
  const [completedOpen, setCompletedOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Objectivo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeGoals = useMemo(() => items.filter((item) => item.status === "ACTIVO"), [items]);
  const completedGoals = useMemo(() => items.filter((item) => item.status === "CONCLUIDO"), [items]);
  const filteredActiveGoals = useMemo(
    () => activeGoals.filter((item) => filter === "TODOS" || item.categoria === filter),
    [activeGoals, filter],
  );

  const currentOnTrack = activeGoals.length
    ? Math.round((activeGoals.filter((item) => item.progresso >= 50).length / activeGoals.length) * 100)
    : onTrackPercentage;

  const showFeedback = (message: string) => {
    toast.success(message);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (objectivo: Objectivo) => {
    setEditing(objectivo);
    setForm(formFromObjectivo(objectivo));
    setError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  };

  const upsertGoal = (goal: Objectivo) => {
    setItems((current) =>
      sortGoals(current.some((item) => item.id === goal.id)
        ? current.map((item) => (item.id === goal.id ? goal : item))
        : [goal, ...current]),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.titulo.trim()) {
      setError("Indica o título do objectivo.");
      return;
    }

    startTransition(async () => {
      const prazo = form.prazo ? new Date(form.prazo) : undefined;
      const result = editing
        ? await updateObjectivoAction(editing.id, form.titulo, form.descricao, form.categoria, prazo)
        : await createObjectivoAction(form.titulo, form.descricao, form.categoria, prazo);

      if (!result.success || !result.data) {
        setError(result.error || "Não foi possível guardar o objectivo.");
        return;
      }

      upsertGoal(normalizeObjectivo(result.data));
      showFeedback(editing ? "Objectivo atualizado." : "Objectivo criado.");
      closeForm();
    });
  };

  const handleToggleSubtask = (objectivoId: string, subTarefaId: string) => {
    const previous = items;
    setItems((current) =>
      current.map((goal) => {
        if (goal.id !== objectivoId) return goal;
        const subTarefas = goal.subTarefas.map((subtarefa) =>
          subtarefa.id === subTarefaId ? { ...subtarefa, concluida: !subtarefa.concluida } : subtarefa,
        );
        return normalizeObjectivo({ ...goal, subTarefas });
      }),
    );

    startTransition(async () => {
      const result = await toggleSubtarefaAction(subTarefaId, objectivoId);
      if (!result.success) {
        setItems(previous);
        setError(result.error || "Não foi possível atualizar a sub-tarefa.");
      }
    });
  };

  const handleAddSubtask = (objectivoId: string) => {
    const titulo = newSubtask[objectivoId]?.trim();
    if (!titulo) return;

    startTransition(async () => {
      const result = await addSubtarefaAction(objectivoId, titulo);
      if (!result.success || !result.data) {
        setError(result.error || "Não foi possível adicionar a sub-tarefa.");
        return;
      }

      setItems((current) =>
        current.map((goal) =>
          goal.id === objectivoId
            ? normalizeObjectivo({ ...goal, subTarefas: [...goal.subTarefas, result.data] })
            : goal,
        ),
      );
      setNewSubtask((current) => ({ ...current, [objectivoId]: "" }));
    });
  };

  const handleDeleteSubtask = (objectivoId: string, subTarefaId: string) => {
    const previous = items;
    setItems((current) =>
      current.map((goal) =>
        goal.id === objectivoId
          ? normalizeObjectivo({
              ...goal,
              subTarefas: goal.subTarefas.filter((subtarefa) => subtarefa.id !== subTarefaId),
            })
          : goal,
      ),
    );

    startTransition(async () => {
      const result = await deleteSubtarefaAction(subTarefaId, objectivoId);
      if (!result.success) {
        setItems(previous);
        setError(result.error || "Não foi possível eliminar a sub-tarefa.");
      }
    });
  };

  const handleStatus = (objectivo: Objectivo, status: "ACTIVO" | "CONCLUIDO") => {
    const previous = items;
    const optimistic = normalizeObjectivo({
      ...objectivo,
      status,
      concluidoEm: status === "CONCLUIDO" ? new Date().toISOString() : null,
    });
    upsertGoal(optimistic);
    showFeedback(status === "CONCLUIDO" ? "Objectivo concluído." : "Objectivo reaberto.");

    startTransition(async () => {
      const result = await updateObjectivoStatusAction(objectivo.id, status);
      if (!result.success || !result.data) {
        setItems(previous);
        setError(result.error || "Não foi possível atualizar o estado.");
        return;
      }
      upsertGoal(normalizeObjectivo(result.data));
    });
  };

  const handleHabitToday = (objectivo: Objectivo) => {
    const previous = items;
    const todayDone = isHabitDoneToday(objectivo);
    const todayKey = new Date().toISOString().slice(0, 10);
    const todaySubtask = objectivo.subTarefas.find(
      (subtarefa) => dateKey(subtarefa.concluidaEm || subtarefa.createdAt) === todayKey,
    );
    const subTarefas = todaySubtask
      ? objectivo.subTarefas.map((subtarefa) =>
          subtarefa.id === todaySubtask.id
            ? {
                ...subtarefa,
                concluida: !subtarefa.concluida,
                concluidaEm: subtarefa.concluida ? null : new Date().toISOString(),
              }
            : subtarefa,
        )
      : [
          ...objectivo.subTarefas,
          {
            id: `temp-${Date.now()}`,
            titulo: "Check-in de hoje",
            concluida: true,
            concluidaEm: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ];

    upsertGoal(normalizeObjectivo({ ...objectivo, subTarefas }));
    showFeedback(todayDone ? "Check-in de hoje removido." : "Hábito registado hoje.");

    startTransition(async () => {
      const result = await markHabitTodayAction(objectivo.id);
      if (!result.success || !result.data) {
        setItems(previous);
        setError(result.error || "Não foi possível registar o hábito.");
        return;
      }

      const persistedSubtask = normalizeObjectivo({
        ...objectivo,
        subTarefas: [result.data],
      }).subTarefas[0];
      setItems((current) =>
        current.map((goal) => {
          if (goal.id !== objectivo.id) return goal;
          const withoutTemp = goal.subTarefas.filter((subtarefa) => !subtarefa.id.startsWith("temp-"));
          const exists = withoutTemp.some((subtarefa) => subtarefa.id === persistedSubtask.id);
          const nextSubtasks = exists
            ? withoutTemp.map((subtarefa) => (subtarefa.id === persistedSubtask.id ? persistedSubtask : subtarefa))
            : [...withoutTemp, persistedSubtask];
          return normalizeObjectivo({ ...goal, subTarefas: nextSubtasks });
        }),
      );
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    showFeedback("Objectivo eliminado.");

    startTransition(async () => {
      const result = await deleteObjectivoAction(deleteTarget.id);
      if (!result.success) {
        setItems(previous);
        setError(result.error || "Não foi possível eliminar o objectivo.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Os meus objectivos</h1>
          <p className="mt-2 text-sm text-gray-600">Acompanha o progresso e mantém o foco nos teus resultados.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Novo objectivo
        </button>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mb-8 grid gap-4 lg:grid-cols-[150px_minmax(0,1fr)]">
        <div className="rounded-xl bg-white p-5 text-center shadow-sm">
          <ProgressRing value={currentOnTrack} />
          <p className="mt-3 text-xs font-medium text-gray-600">Objectivos no ritmo</p>
        </div>

        <div className="rounded-xl bg-blue-50 p-2 shadow-sm">
          <div className="grid h-full gap-2 sm:grid-cols-4">
            <FilterCard active={filter === "TODOS"} onClick={() => setFilter("TODOS")} label="Todos" dot="bg-blue-700" />
            <FilterCard active={filter === "ACADEMICO"} onClick={() => setFilter("ACADEMICO")} label="Académico" dot={categoryMeta.ACADEMICO.dot} />
            <FilterCard active={filter === "PESSOAL"} onClick={() => setFilter("PESSOAL")} label="Pessoal" dot={categoryMeta.PESSOAL.dot} />
            <FilterCard active={filter === "HABITO"} onClick={() => setFilter("HABITO")} label="Hábito" dot={categoryMeta.HABITO.dot} />
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredActiveGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-white/80 p-10 text-center md:col-span-2 xl:col-span-3">
            <Target className="mx-auto mb-3 h-10 w-10 text-blue-300" />
            <p className="text-sm text-gray-600">Nenhum objectivo activo nesta categoria.</p>
          </div>
        ) : (
          filteredActiveGoals.map((objectivo) => (
            <GoalCard
              key={objectivo.id}
              objectivo={objectivo}
              newSubtask={newSubtask[objectivo.id] ?? ""}
              setNewSubtask={(value) => setNewSubtask((current) => ({ ...current, [objectivo.id]: value }))}
              onAddSubtask={() => handleAddSubtask(objectivo.id)}
              onToggleSubtask={(subTarefaId) => handleToggleSubtask(objectivo.id, subTarefaId)}
              onDeleteSubtask={(subTarefaId) => handleDeleteSubtask(objectivo.id, subTarefaId)}
              onEdit={() => openEdit(objectivo)}
              onDelete={() => setDeleteTarget(objectivo)}
              onComplete={() => handleStatus(objectivo, "CONCLUIDO")}
              onHabitToday={() => handleHabitToday(objectivo)}
            />
          ))
        )}
      </section>

      <section className="rounded-xl bg-blue-50">
        <button
          type="button"
          onClick={() => setCompletedOpen((value) => !value)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="inline-flex items-center gap-3 text-sm font-semibold text-gray-800">
            <CheckCircle2 className="h-5 w-5 text-blue-700" />
            Objectivos concluídos
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              {completedGoals.length || completedCount}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition ${completedOpen ? "rotate-180" : ""}`} />
        </button>

        {completedOpen ? (
          <div className="grid gap-4 px-5 pb-5 md:grid-cols-2 xl:grid-cols-3">
            {completedGoals.length ? (
              completedGoals.map((objectivo) => (
                <CompletedGoalCard
                  key={objectivo.id}
                  objectivo={objectivo}
                  onReopen={() => handleStatus(objectivo, "ACTIVO")}
                  onDelete={() => setDeleteTarget(objectivo)}
                />
              ))
            ) : (
              <p className="rounded-lg bg-white p-4 text-sm text-gray-500">Ainda não há objectivos concluídos.</p>
            )}
          </div>
        ) : null}
      </section>

      {formOpen ? (
        <GoalForm
          form={form}
          setForm={setForm}
          editing={editing}
          isPending={isPending}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteDialog
          objectivo={deleteTarget}
          isPending={isPending}
          onClose={() => setDeleteTarget(null)}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className="relative mx-auto h-24 w-24">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="#E0E7FF" strokeWidth="7" />
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke="#1D4ED8"
          strokeLinecap="round"
          strokeWidth="7"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-blue-700">
        {value}%
      </div>
    </div>
  );
}

function FilterCard({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-28 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:bg-white/70"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </button>
  );
}

function GoalCard({
  objectivo,
  newSubtask,
  setNewSubtask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onEdit,
  onDelete,
  onComplete,
  onHabitToday,
}: {
  objectivo: Objectivo;
  newSubtask: string;
  setNewSubtask: (value: string) => void;
  onAddSubtask: () => void;
  onToggleSubtask: (subTarefaId: string) => void;
  onDeleteSubtask: (subTarefaId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onHabitToday: () => void;
}) {
  const meta = categoryMeta[objectivo.categoria] ?? categoryMeta.ACADEMICO;
  const isHabit = objectivo.categoria === "HABITO";
  const habitDoneToday = isHabitDoneToday(objectivo);
  const habitStreak = getHabitStreak(objectivo);
  const habitLogs = getHabitLogs(objectivo);

  return (
    <article className="rounded-xl bg-white p-5 shadow-sm" style={{ borderLeft: `4px solid ${meta.border}` }}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.badge}`}>{meta.label}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onEdit} className="rounded-lg p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-700" title="Editar">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Apagar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h2 className="mb-2 text-lg font-bold text-gray-900">{objectivo.titulo}</h2>
      {objectivo.descricao ? <p className="mb-3 text-sm leading-5 text-gray-600">{objectivo.descricao}</p> : null}
      {isHabit ? (
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500">Estado</p>
            <p className="mt-1 font-semibold text-gray-800">Em curso</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Streak</p>
            <p className="mt-1 font-semibold text-gray-800">{habitStreak} dias</p>
          </div>
        </div>
      ) : objectivo.prazo ? (
        <p className="mb-4 inline-flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays className="h-4 w-4" />
          Prazo: {formatDate(objectivo.prazo)}
        </p>
      ) : null}

      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-gray-600">{isHabit ? "Consistência" : "Progresso"}</span>
          <span className="font-semibold text-gray-700">
            {isHabit ? `${habitLogs.length} check-ins` : `${objectivo.progresso}%`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-700 transition-all"
            style={{ width: `${isHabit ? Math.min(habitLogs.length * 10, 100) : objectivo.progresso}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {(isHabit ? objectivo.subTarefas.slice(-5).reverse() : objectivo.subTarefas).map((subtarefa) => (
          <div key={subtarefa.id} className="group flex items-center gap-2 rounded-lg py-1">
            <button
              type="button"
              onClick={() => onToggleSubtask(subtarefa.id)}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                subtarefa.concluida ? "border-blue-700 bg-blue-700 text-white" : "border-gray-300 bg-white"
              }`}
            >
              {subtarefa.concluida ? <Check className="h-3 w-3" /> : null}
            </button>
            <span className={`min-w-0 flex-1 text-sm ${subtarefa.concluida ? "text-gray-400 line-through" : "text-gray-700"}`}>
              {isHabit && subtarefa.concluidaEm ? formatDate(subtarefa.concluidaEm) : subtarefa.titulo}
            </span>
            <button
              type="button"
              onClick={() => onDeleteSubtask(subtarefa.id)}
              className="opacity-0 transition group-hover:opacity-100 rounded p-1 text-gray-400 hover:text-red-600"
              title="Eliminar sub-tarefa"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {isHabit ? (
        <button
          type="button"
          onClick={onHabitToday}
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            habitDoneToday
              ? "bg-blue-700 text-white hover:bg-blue-800"
              : "border border-blue-200 text-blue-700 hover:bg-blue-50"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {habitDoneToday ? "Feito hoje" : "Marcar hoje"}
        </button>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            <input
              value={newSubtask}
              onChange={(event) => setNewSubtask(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onAddSubtask();
              }}
              placeholder="Nova sub-tarefa..."
              className="min-w-0 flex-1 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button type="button" onClick={onAddSubtask} className="rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onComplete}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Concluir objectivo
          </button>
        </>
      )}
    </article>
  );
}

function CompletedGoalCard({
  objectivo,
  onReopen,
  onDelete,
}: {
  objectivo: Objectivo;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const meta = categoryMeta[objectivo.categoria] ?? categoryMeta.ACADEMICO;

  return (
    <article className="rounded-xl bg-white p-4 shadow-sm opacity-80">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.badge}`}>{meta.label}</span>
        <button type="button" onClick={onDelete} className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <h3 className="font-bold text-gray-700 line-through">{objectivo.titulo}</h3>
      <p className="mt-2 text-xs text-gray-500">
        {objectivo.concluidoEm ? `Concluído em ${formatDate(objectivo.concluidoEm)}` : "Concluído"}
      </p>
      <button type="button" onClick={onReopen} className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800">
        Reabrir
      </button>
    </article>
  );
}

function GoalForm({
  form,
  setForm,
  editing,
  isPending,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  editing: Objectivo | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain px-4 py-8">
      <div className="fixed inset-0 bg-black/40" role="presentation" onClick={onClose} />
      <div className="relative mx-auto flex w-full max-w-xl items-start justify-center sm:py-2">
        <section
          role="dialog"
          aria-modal="true"
          className="relative flex max-h-[min(90vh,calc(100vh-48px))] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{editing ? "Editar objectivo" : "Novo objectivo"}</h2>
              <p className="mt-1 text-sm text-gray-600">Define a meta, categoria e prazo.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form id="goal-form" onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <TextField label="Título" value={form.titulo} placeholder="Ex: Finalizar teste de mestrado" onChange={(titulo) => setForm((prev) => ({ ...prev, titulo }))} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                  placeholder="Detalha o objectivo, contexto ou critérios de sucesso..."
                  className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="ACADEMICO">Académico</option>
                    <option value="PESSOAL">Pessoal</option>
                    <option value="HABITO">Hábito</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Prazo</label>
                  <input
                    type="date"
                    value={form.prazo}
                    onChange={(event) => setForm((prev) => ({ ...prev, prazo: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cancelar
              </button>
              <button
                type="submit"
                form="goal-form"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isPending ? "A guardar..." : "Guardar objectivo"}
              </button>
            </div>
          </div>
        </section>
      </div>
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

function DeleteDialog({
  objectivo,
  isPending,
  onClose,
  onDelete,
}: {
  objectivo: Objectivo;
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
            <h2 className="text-xl font-bold text-gray-900">Apagar objectivo?</h2>
            <p className="mt-2 text-sm text-gray-600">As sub-tarefas associadas também serão removidas.</p>
          </div>
        </div>

        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{objectivo.titulo}</p>
          <p className="mt-1">{objectivo.totalSubtarefas} sub-tarefas · {objectivo.progresso}% concluído</p>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Apagar definitivamente
          </button>
        </div>
      </section>
    </div>
  );
}
