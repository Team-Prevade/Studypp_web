"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  GraduationCap,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteAccountAction,
  updateProfileAction,
} from "@/lib/profile-actions";

interface UserData {
  id: string;
  nome: string;
  email: string;
  avatarUrl?: string | null;
  anoEscolar?: string | null;
  curso?: string | null;
  bio?: string | null;
  onboardingFeito: boolean;
  createdAt?: Date | string;
  _count?: {
    aulas: number;
    tarefas: number;
    notas: number;
    disciplinas: number;
  };
}

interface ProfileViewProps {
  user: UserData;
}

type FormState = {
  nome: string;
  anoEscolar: string;
  curso: string;
  bio: string;
};

const schoolYears = [
  "7º Ano",
  "8º Ano",
  "9º Ano",
  "10º Ano",
  "11º Ano",
  "12º Ano",
  "1º Ano Universitário",
  "2º Ano Universitário",
  "3º Ano Universitário",
  "Outro",
];

function formatMemberSince(value?: Date | string) {
  if (!value) return "Conta recente";
  return new Intl.DateTimeFormat("pt-PT", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileView({ user }: ProfileViewProps) {
  const [form, setForm] = useState<FormState>({
    nome: user.nome,
    anoEscolar: user.anoEscolar ?? "",
    curso: user.curso ?? "",
    bio: user.bio ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [isPending, startTransition] = useTransition();

  const bioCount = form.bio.length;
  const counts = useMemo(
    () => ({
      disciplinas: user._count?.disciplinas ?? 0,
      aulas: user._count?.aulas ?? 0,
      tarefas: user._count?.tarefas ?? 0,
      notas: user._count?.notas ?? 0,
    }),
    [user._count],
  );

  const showFeedback = (message: string) => {
    toast.success(message);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nome.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    startTransition(async () => {
      const result = await updateProfileAction(
        form.nome,
        user.email,
        form.anoEscolar,
        form.curso,
        form.bio,
      );

      if (!result.success) {
        setError(result.error || "Não foi possível atualizar o perfil.");
        return;
      }

      setError(null);
      showFeedback("Perfil atualizado.");
    });
  };

  const handleDeleteAccount = () => {
    if (deleteText !== user.email) return;

    startTransition(async () => {
      const result = await deleteAccountAction();
      if (!result.success) {
        setError(result.error || "Não foi possível eliminar a conta.");
        return;
      }

      window.location.href = "/login";
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-blue-700">Perfil</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">A tua conta Study++</h1>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-xl bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-3xl font-bold text-blue-700 ring-4 ring-blue-50">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.nome} className="h-full w-full object-cover" />
              ) : (
                initials(form.nome || user.nome)
              )}
            </div>
            <button type="button" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
              <Upload className="h-3.5 w-3.5" />
              Carregar foto
            </button>
            <h2 className="text-xl font-bold text-gray-900">{form.nome || user.nome}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {form.anoEscolar || "Ano não definido"} · {form.curso || "Curso não definido"}
            </p>

            <div className="mt-6 space-y-3 text-left text-sm">
              <InfoRow label="Membro desde" value={formatMemberSince(user.createdAt)} />
              <InfoRow
                label="Estado"
                value={
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    <ShieldCheck className="h-3 w-3" />
                    {user.onboardingFeito ? "Activa" : "Configuração pendente"}
                  </span>
                }
              />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <StatCard icon={<BookOpen className="h-4 w-4" />} label="Disciplinas" value={counts.disciplinas} />
            <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Aulas" value={counts.aulas} />
            <StatCard icon={<Check className="h-4 w-4" />} label="Tarefas" value={counts.tarefas} />
            <StatCard icon={<GraduationCap className="h-4 w-4" />} label="Notas" value={counts.notas} />
          </section>
        </aside>

        <main className="space-y-6">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-gray-900">Informações pessoais</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Nome" value={form.nome} onChange={(nome) => setForm((current) => ({ ...current, nome }))} />
                <TextField label="Email" value={user.email} readOnly onChange={() => undefined} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ano escolar</label>
                  <select
                    value={form.anoEscolar}
                    onChange={(event) => setForm((current) => ({ ...current, anoEscolar: event.target.value }))}
                    className="w-full rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Selecionar ano</option>
                    {schoolYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <TextField label="Curso" value={form.curso} onChange={(curso) => setForm((current) => ({ ...current, curso }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value.slice(0, 300) }))}
                  placeholder="Fala um pouco sobre os teus objetivos, rotina ou área de estudo..."
                  className="h-28 w-full resize-none rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="mt-1 text-right text-xs text-gray-400">{bioCount}/300 caracteres</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "A guardar..." : "Guardar alterações"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-red-700">Zona de perigo</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Ao eliminar a tua conta, todos os dados, horários e notas serão permanentemente removidos.
                </p>
              </div>
            </div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Escreve o teu email para confirmar
            </label>
            <input
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
              placeholder={user.email}
              className="mb-4 w-full max-w-md rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteText !== user.email || isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar conta
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-blue-700">
        {icon}
        <span className="text-xs font-semibold text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600 read-only:text-gray-500"
      />
    </div>
  );
}
