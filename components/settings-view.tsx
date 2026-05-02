"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Mail,
  Palette,
  Save,
  Settings2,
} from "lucide-react";
import { updateSettingsAction, type SettingsData } from "@/lib/settings-actions";

interface SettingsViewProps {
  initialSettings: SettingsData;
}

const accentOptions = ["#2563EB", "#1E40AF", "#0D9488", "#7C3AED", "#059669"];

const themeOptions = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

const taskLeadOptions = [
  { value: 0, label: "Na hora" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 dia antes" },
  { value: 2880, label: "2 dias antes" },
  { value: 10080, label: "1 semana antes" },
];

export function SettingsView({ initialSettings }: SettingsViewProps) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const updateNotif = <K extends keyof SettingsData["notificacoes"]>(
    key: K,
    value: SettingsData["notificacoes"][K],
  ) => {
    setSettings((current) => ({
      ...current,
      notificacoes: {
        ...current.notificacoes,
        [key]: value,
      },
    }));
    setError(null);
  };

  const handleBrowserNotificationToggle = async () => {
    const nextValue = !settings.notificacoes.browserNotif;

    if (nextValue) {
      if (!("Notification" in window)) {
        setError("Este browser não suporta notificações nativas.");
        toast.error("Este browser não suporta notificações nativas.");
        return;
      }

      if (Notification.permission === "denied") {
        setError("As notificações estão bloqueadas no browser. Ativa-as nas permissões do site.");
        toast.error("Notificações bloqueadas no browser.");
        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Permissão de notificações não concedida.");
          toast.error("Permissão de notificações não concedida.");
          return;
        }
      }

      toast.success("Notificações do browser ativadas.");
    }

    updateNotif("browserNotif", nextValue);
  };

  const handleSave = () => {
    if (settings.anoLectivoInicio && settings.anoLectivoFim) {
      const start = new Date(settings.anoLectivoInicio);
      const end = new Date(settings.anoLectivoFim);
      if (start > end) {
        setError("A data de início do ano académico deve ser anterior à data de fim.");
        return;
      }
    }

    startTransition(async () => {
      const result = await updateSettingsAction(settings);
      if (!result.success || !result.data) {
        setError(result.error || "Não foi possível guardar as definições.");
        return;
      }

      setSettings(result.data);
      toast.success("Definições guardadas.");
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Definições</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Preferências da aplicação</h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "A guardar..." : "Guardar alterações"}
        </button>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <SectionTitle icon={<Palette className="h-5 w-5" />} title="Aparência" />
          <SettingRow title="Tema da aplicação" description="Escolhe o modo visual preferido.">
            <div className="inline-flex rounded-lg bg-blue-50 p-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update("modoAppearance", option.value)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    settings.modoAppearance === option.value
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-blue-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow title="Cor de destaque" description="Personaliza a cor principal da interface.">
            <div className="flex items-center gap-3">
              {accentOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update("corAcento", color)}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    settings.corAcento === color ? "scale-110 border-gray-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Cor ${color}`}
                />
              ))}
            </div>
          </SettingRow>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <SectionTitle icon={<CalendarDays className="h-5 w-5" />} title="Agenda" />
          <SettingRow title="Primeiro dia da semana">
            <select
              value={settings.primeiroDiaSemana}
              onChange={(event) => update("primeiroDiaSemana", event.target.value)}
              className="w-full rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 sm:w-48"
            >
              <option value="SEGUNDA">Segunda-feira</option>
              <option value="DOMINGO">Domingo</option>
            </select>
          </SettingRow>
          <SettingRow title="Duração padrão da tarefa" description="Tempo estimado ao criar uma nova tarefa.">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={settings.duracaoTarefaPadrao}
                onChange={(event) => update("duracaoTarefaPadrao", Number(event.target.value))}
                className="w-24 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-sm text-gray-500">min</span>
            </div>
          </SettingRow>
          <SettingRow title="Mostrar fins de semana" description="Exibir sábado e domingo no calendário.">
            <Switch checked={settings.mostrarFimSemana} onChange={() => update("mostrarFimSemana", !settings.mostrarFimSemana)} />
          </SettingRow>
          <div className="mt-5 border-t border-gray-100 pt-5">
            <h3 className="mb-4 text-sm font-bold text-gray-900">Ano académico</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <DateField label="Data de início" value={settings.anoLectivoInicio} onChange={(value) => update("anoLectivoInicio", value)} />
              <DateField label="Data de fim" value={settings.anoLectivoFim} onChange={(value) => update("anoLectivoFim", value)} />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <SectionTitle icon={<Bell className="h-5 w-5" />} title="Notificações" />
          <SettingRow title="Lembretes" description="Ativar avisos para lembretes criados.">
            <Switch checked={settings.notificacoes.notifLembretesAtivo} onChange={() => updateNotif("notifLembretesAtivo", !settings.notificacoes.notifLembretesAtivo)} />
          </SettingRow>
          <SettingRow title="Tarefas" description="Receber avisos antes do prazo das tarefas.">
            <Switch checked={settings.notificacoes.notifTarefasAtivo} onChange={() => updateNotif("notifTarefasAtivo", !settings.notificacoes.notifTarefasAtivo)} />
          </SettingRow>
          <SettingRow title="Antecedência das tarefas">
            <select
              value={settings.notificacoes.notifTarefasAntecedencia}
              onChange={(event) => updateNotif("notifTarefasAntecedencia", Number(event.target.value))}
              className="w-full rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 sm:w-48"
            >
              {taskLeadOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow title="Tarefas atrasadas">
            <Switch checked={settings.notificacoes.notifTarefasAtrasadas} onChange={() => updateNotif("notifTarefasAtrasadas", !settings.notificacoes.notifTarefasAtrasadas)} />
          </SettingRow>
          <SettingRow title="Sessões de estudo" description="Avisos de início, pausa e fim de sessão.">
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={settings.notificacoes.notifEstudoInicio} onClick={() => updateNotif("notifEstudoInicio", !settings.notificacoes.notifEstudoInicio)}>Início</ToggleChip>
              <ToggleChip active={settings.notificacoes.notifEstudoFimPausa} onClick={() => updateNotif("notifEstudoFimPausa", !settings.notificacoes.notifEstudoFimPausa)}>Pausa</ToggleChip>
              <ToggleChip active={settings.notificacoes.notifEstudoFimSessao} onClick={() => updateNotif("notifEstudoFimSessao", !settings.notificacoes.notifEstudoFimSessao)}>Fim</ToggleChip>
            </div>
          </SettingRow>
          <SettingRow title="Objectivos" description="Avisar antes do prazo dos objectivos.">
            <div className="flex items-center gap-3">
              <Switch checked={settings.notificacoes.notifObjectivosAtivo} onChange={() => updateNotif("notifObjectivosAtivo", !settings.notificacoes.notifObjectivosAtivo)} />
              <input
                type="number"
                min={1}
                max={30}
                value={settings.notificacoes.notifObjectivosDias}
                onChange={(event) => updateNotif("notifObjectivosDias", Number(event.target.value))}
                className="w-20 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-sm text-gray-500">dias antes</span>
            </div>
          </SettingRow>
          <SettingRow title="Canais" description="Escolhe onde receber notificações.">
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={settings.notificacoes.browserNotif} onClick={handleBrowserNotificationToggle}>Browser</ToggleChip>
              <ToggleChip active={settings.notificacoes.emailNotif} onClick={() => updateNotif("emailNotif", !settings.notificacoes.emailNotif)}>Email</ToggleChip>
            </div>
          </SettingRow>
          {settings.notificacoes.emailNotif ? (
            <SettingRow title="Email de notificações">
              <div className="relative w-full sm:w-80">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                <input
                  type="email"
                  value={settings.notificacoes.emailNotifAddress}
                  onChange={(event) => updateNotif("emailNotifAddress", event.target.value)}
                  className="w-full rounded-lg border border-blue-100 bg-blue-50 px-9 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </SettingRow>
          ) : null}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-blue-700">
                <Settings2 className="h-5 w-5" />
                <h2 className="font-bold text-gray-900">Disciplinas</h2>
              </div>
              <p className="text-sm text-gray-500">Ajusta matérias, cores, professores e detalhes académicos.</p>
            </div>
            <Link href="/disciplinas" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
              Gerir disciplinas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2 text-blue-700">
      {icon}
      <h2 className="font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-gray-100 py-5 last:border-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
      <div className="lg:justify-self-end">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-blue-700" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
      />
    </label>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-blue-700 text-white" : "bg-blue-50 text-gray-600 hover:text-blue-700"
      }`}
    >
      {children}
    </button>
  );
}
