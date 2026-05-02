"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  Clock3,
  Edit2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  createLembreteAction,
  deleteLembreteAction,
  toggleLembreteConcluidoAction,
  updateLembreteAction,
} from "@/lib/lembretes-actions";
import { toast } from "sonner";

interface Disciplina {
  id: string;
  nome: string;
  cor: string;
}

interface Lembrete {
  id: string;
  titulo: string;
  dataHora: string;
  disciplinaId?: string | null;
  repetir: string;
  notas?: string | null;
  concluido: boolean;
  concluidoEm?: string | null;
  disciplina?: Disciplina | null;
}

interface LembretesViewProps {
  lembretes: Lembrete[];
  disciplinas: Disciplina[];
  grupos: {
    atrasados: Lembrete[];
    hoje: Lembrete[];
    amanha: Lembrete[];
    futuros: Lembrete[];
  };
}

type FormState = {
  titulo: string;
  data: string;
  hora: string;
  disciplinaId: string;
  repetir: string;
  notas: string;
};

const emptyForm: FormState = {
  titulo: "",
  data: "",
  hora: "",
  disciplinaId: "",
  repetir: "NUNCA",
  notas: "",
};

const repetirLabels: Record<string, string> = {
  NUNCA: "Uma vez",
  DIARIO: "Diário",
  SEMANAL: "Semanal",
};

const repetirHelp: Record<string, string> = {
  NUNCA: "O lembrete acontece apenas uma vez, na data e hora escolhidas.",
  DIARIO: "Depois de concluído, este lembrete representa uma rotina diária. A próxima ocorrência deverá manter o mesmo horário.",
  SEMANAL: "Depois de concluído, este lembrete representa uma rotina semanal no mesmo dia e horário.",
};

function normalizeLembrete(input: any): Lembrete {
  return {
    ...input,
    dataHora: new Date(input.dataHora).toISOString(),
    concluidoEm: input.concluidoEm ? new Date(input.concluidoEm).toISOString() : null,
    disciplina: input.disciplina ?? null,
  };
}

function dateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function timeInput(value: string) {
  return new Date(value).toTimeString().slice(0, 5);
}

function formFromReminder(lembrete: Lembrete): FormState {
  return {
    titulo: lembrete.titulo,
    data: dateInput(lembrete.dataHora),
    hora: timeInput(lembrete.dataHora),
    disciplinaId: lembrete.disciplinaId || lembrete.disciplina?.id || "",
    repetir: lembrete.repetir,
    notas: lembrete.notas || "",
  };
}

function todayDefaults(): FormState {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  return {
    ...emptyForm,
    data: now.toISOString().slice(0, 10),
    hora: now.toTimeString().slice(0, 5),
  };
}

function groupReminders(items: Lembrete[]) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const endOfTomorrow = new Date(startOfTomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);
  const sorted = [...items].sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

  return {
    atrasados: sorted.filter((item) => !item.concluido && new Date(item.dataHora) < startOfToday),
    hoje: sorted.filter((item) => {
      const date = new Date(item.dataHora);
      return date >= startOfToday && date <= endOfToday;
    }),
    amanha: sorted.filter((item) => {
      const date = new Date(item.dataHora);
      return date >= startOfTomorrow && date <= endOfTomorrow;
    }),
    futuros: sorted.filter((item) => new Date(item.dataHora) > endOfTomorrow),
  };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function LembretesView({ lembretes, disciplinas }: LembretesViewProps) {
  const [items, setItems] = useState(() => lembretes.map(normalizeLembrete));
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<FormState>(() => todayDefaults());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lembrete | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lembrete | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.titulo} ${item.notas || ""} ${item.disciplina?.nome || ""}`.toLowerCase().includes(needle),
    );
  }, [items, searchTerm]);

  const groups = useMemo(() => groupReminders(filteredItems), [filteredItems]);

  const showFeedback = (message: string) => {
    toast.success(message);
  };

  const closeForm = () => {
    setForm(todayDefaults());
    setEditing(null);
    setFormOpen(false);
    setError(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(todayDefaults());
    setError(null);
    setFormOpen(true);
  };

  const editReminder = (lembrete: Lembrete) => {
    setEditing(lembrete);
    setForm(formFromReminder(lembrete));
    setError(null);
    setFormOpen(true);
  };

  const upsertReminder = (lembrete: Lembrete) => {
    setItems((current) =>
      current.some((item) => item.id === lembrete.id)
        ? current.map((item) => (item.id === lembrete.id ? lembrete : item))
        : [lembrete, ...current],
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.titulo.trim() || !form.data || !form.hora) {
      setError("Preenche o título, data e hora.");
      return;
    }

    const payload = {
      titulo: form.titulo,
      dataHora: new Date(`${form.data}T${form.hora}:00`),
      disciplinaId: form.disciplinaId || null,
      repetir: form.repetir,
      notas: form.notas,
    };

    startTransition(async () => {
      const result = editing
        ? await updateLembreteAction(editing.id, payload)
        : await createLembreteAction(payload);

      if (!result.success || !result.data) {
        setError(result.error || "Não foi possível guardar o lembrete.");
        return;
      }

      upsertReminder(normalizeLembrete(result.data));
      showFeedback(editing ? "Lembrete atualizado." : "Lembrete criado.");
      closeForm();
    });
  };

  const handleToggle = (lembrete: Lembrete) => {
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.id === lembrete.id
          ? { ...item, concluido: !item.concluido, concluidoEm: item.concluido ? null : new Date().toISOString() }
          : item,
      ),
    );

    startTransition(async () => {
      const result = await toggleLembreteConcluidoAction(lembrete.id);
      if (!result.success || !result.data) {
        setItems(previous);
        setError(result.error || "Não foi possível atualizar o lembrete.");
        return;
      }
      upsertReminder(normalizeLembrete(result.data));
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    if (editing?.id === deleteTarget.id) closeForm();
    showFeedback("Lembrete eliminado.");

    startTransition(async () => {
      const result = await deleteLembreteAction(deleteTarget.id);
      if (!result.success) {
        setItems(previous);
        setError(result.error || "Não foi possível eliminar o lembrete.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lembretes</h1>
          <p className="mt-2 text-sm text-gray-600">Mantém prazos, revisões e compromissos académicos no radar.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
            <input
              type="search"
              placeholder="Pesquisar lembretes..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-blue-100 bg-white px-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            Adicionar lembrete
          </button>
        </div>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <main className="space-y-8">
        <ReminderSection
          title="Atrasados"
          tone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
          items={groups.atrasados}
          empty="Sem lembretes atrasados."
          onToggle={handleToggle}
          onEdit={editReminder}
          onDelete={setDeleteTarget}
        />
        <ReminderSection
          title="Hoje"
          items={groups.hoje}
          empty="Nenhum lembrete para hoje."
          onToggle={handleToggle}
          onEdit={editReminder}
          onDelete={setDeleteTarget}
        />
        <ReminderSection
          title="Amanhã"
          items={groups.amanha}
          empty="Nenhum lembrete para amanhã."
          onToggle={handleToggle}
          onEdit={editReminder}
          onDelete={setDeleteTarget}
        />
        <ReminderSection
          title="Próximos"
          items={groups.futuros}
          empty="Nenhum lembrete futuro."
          onToggle={handleToggle}
          onEdit={editReminder}
          onDelete={setDeleteTarget}
        />
      </main>

      {formOpen ? (
        <ReminderFormModal
          form={form}
          setForm={setForm}
          editing={editing}
          disciplinas={disciplinas}
          isPending={isPending}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteDialog
          lembrete={deleteTarget}
          isPending={isPending}
          onClose={() => setDeleteTarget(null)}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}

function ReminderSection({
  title,
  items,
  empty,
  tone,
  icon,
  onToggle,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Lembrete[];
  empty: string;
  tone?: "danger";
  icon?: React.ReactNode;
  onToggle: (lembrete: Lembrete) => void;
  onEdit: (lembrete: Lembrete) => void;
  onDelete: (lembrete: Lembrete) => void;
}) {
  if (items.length === 0 && tone === "danger") return null;

  return (
    <section>
      <h2 className={`mb-3 flex items-center gap-2 text-sm font-bold ${tone === "danger" ? "text-amber-700" : "text-gray-800"}`}>
        {icon}
        {title}
      </h2>
      <div className={`space-y-3 ${tone === "danger" ? "border-l-4 border-amber-600 pl-4" : ""}`}>
        {items.length === 0 ? (
          <div className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow-sm">{empty}</div>
        ) : (
          items.map((lembrete) => (
            <ReminderCard
              key={lembrete.id}
              lembrete={lembrete}
              overdue={tone === "danger"}
              onToggle={() => onToggle(lembrete)}
              onEdit={() => onEdit(lembrete)}
              onDelete={() => onDelete(lembrete)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ReminderCard({
  lembrete,
  overdue,
  onToggle,
  onEdit,
  onDelete,
}: {
  lembrete: Lembrete;
  overdue?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
            lembrete.concluido
              ? "border-blue-700 bg-blue-700 text-white"
              : overdue
                ? "border-amber-600 bg-amber-50"
                : "border-blue-200 bg-blue-50"
          }`}
          aria-label="Marcar lembrete como concluído"
        >
          {lembrete.concluido ? <Check className="h-3.5 w-3.5" /> : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`font-semibold text-gray-900 ${lembrete.concluido ? "text-gray-400 line-through" : ""}`}>
                {lembrete.titulo}
              </h3>
              {lembrete.notas ? <p className="mt-1 line-clamp-2 text-sm text-gray-600">{lembrete.notas}</p> : null}
            </div>
            <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={onEdit} className="rounded-lg p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-700">
                <Edit2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={onDelete} className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${overdue ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
              <Clock3 className="h-3 w-3" />
              {overdue ? `${formatDate(lembrete.dataHora)}, ${formatTime(lembrete.dataHora)}` : formatTime(lembrete.dataHora)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
              {repetirLabels[lembrete.repetir] || "Uma vez"}
            </span>
            {lembrete.disciplina ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lembrete.disciplina.cor }} />
                {lembrete.disciplina.nome}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function ReminderFormModal({
  form,
  setForm,
  editing,
  disciplinas,
  isPending,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  editing: Lembrete | null;
  disciplinas: Disciplina[];
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
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-700" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editing ? "Editar lembrete" : "Adicionar lembrete"}</h2>
                <p className="mt-1 text-sm text-gray-600">Define data, disciplina e repetição com cuidado.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form id="reminder-form" onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <TextField
                value={form.titulo}
                onChange={(titulo) => setForm((current) => ({ ...current, titulo }))}
                placeholder="O que precisas lembrar?"
              />
              <div className="grid grid-cols-2 gap-3">
                <InputShell label="Data">
                  <input
                    type="date"
                    value={form.data}
                    onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))}
                    className="w-full bg-transparent text-sm text-gray-900 outline-none"
                  />
                </InputShell>
                <InputShell label="Hora">
                  <input
                    type="time"
                    value={form.hora}
                    onChange={(event) => setForm((current) => ({ ...current, hora: event.target.value }))}
                    className="w-full bg-transparent text-sm text-gray-900 outline-none"
                  />
                </InputShell>
              </div>
              <InputShell label="Disciplina">
                <select
                  value={form.disciplinaId}
                  onChange={(event) => setForm((current) => ({ ...current, disciplinaId: event.target.value }))}
                  className="w-full bg-transparent text-sm text-gray-900 outline-none"
                >
                  <option value="">Sem disciplina</option>
                  {disciplinas.map((disciplina) => (
                    <option key={disciplina.id} value={disciplina.id}>
                      {disciplina.nome}
                    </option>
                  ))}
                </select>
              </InputShell>
              <InputShell label="Repetição">
                <select
                  value={form.repetir}
                  onChange={(event) => setForm((current) => ({ ...current, repetir: event.target.value }))}
                  className="w-full bg-transparent text-sm text-gray-900 outline-none"
                >
                  <option value="NUNCA">Não repetir</option>
                  <option value="DIARIO">Diário</option>
                  <option value="SEMANAL">Semanal</option>
                </select>
              </InputShell>
              <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
                {repetirHelp[form.repetir] || repetirHelp.NUNCA}
              </div>
              <textarea
                placeholder="Notas opcionais"
                value={form.notas}
                onChange={(event) => setForm((current) => ({ ...current, notas: event.target.value }))}
                className="h-24 w-full resize-none rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </form>

          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cancelar
              </button>
              <button
                type="submit"
                form="reminder-form"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isPending ? "A guardar..." : editing ? "Guardar alterações" : "Salvar lembrete"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
    />
  );
}

function InputShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-lg border border-blue-100 bg-white px-3 py-2">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function DeleteDialog({
  lembrete,
  isPending,
  onClose,
  onDelete,
}: {
  lembrete: Lembrete;
  isPending: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" role="presentation" onClick={onClose} />
      <section className="relative w-full max-w-md rounded-xl border border-red-100 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Eliminar lembrete?</h2>
            <p className="mt-2 text-sm text-gray-600">Esta ação remove o lembrete definitivamente.</p>
          </div>
        </div>
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{lembrete.titulo}</p>
          <p className="mt-1">{formatDate(lembrete.dataHora)} às {formatTime(lembrete.dataHora)}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="button" onClick={onDelete} disabled={isPending} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            Eliminar
          </button>
        </div>
      </section>
    </div>
  );
}
