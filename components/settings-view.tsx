"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Palette,
  CalendarDays,
  Settings2,
  ChevronRight,
  Check,
} from "lucide-react";

const storageKey = "studypp:settings";

type ThemeMode = "claro" | "escuro" | "sistema";

type WeekStart = "SEGUNDA" | "DOMINGO";

interface SettingsState {
  themeMode: ThemeMode;
  accentColor: string;
  weekStart: WeekStart;
  taskDuration: number;
  showWeekend: boolean;
  academicStart: string;
  academicEnd: string;
}

const defaultSettings: SettingsState = {
  themeMode: "claro",
  accentColor: "#0f766e",
  weekStart: "SEGUNDA",
  taskDuration: 45,
  showWeekend: true,
  academicStart: "2023-09-15",
  academicEnd: "2024-06-30",
};

const accentOptions = ["#0f766e", "#7c3aed", "#2563eb", "#059669"];

export function SettingsView() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      setSettings((current) => ({ ...current, ...parsed }));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const handleSave = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const weekStartLabel = useMemo(
    () => (settings.weekStart === "SEGUNDA" ? "Segunda-feira" : "Domingo"),
    [settings.weekStart],
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Definições</h1>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <button className="rounded-lg p-2 hover:bg-white transition">
            <Bell size={18} />
          </button>
          <Link
            href="/perfil"
            className="h-10 w-10 overflow-hidden rounded-full bg-linear-to-br from-blue-600 to-blue-800 shadow-sm"
          >
            <div className="flex h-full w-full items-center justify-center text-white font-semibold">
              U
            </div>
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center gap-3">
            <Palette className="text-teal-700" size={18} />
            <h2 className="text-xl font-bold text-gray-900">Aparência</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Tema da aplicação
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Escolha o modo visual preferido
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              {(
                [
                  ["claro", "Claro"],
                  ["escuro", "Escuro"],
                  ["sistema", "Sistema"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    setSettings((current) => ({ ...current, themeMode: value }))
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    settings.themeMode === value
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Cor de destaque
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Personalize a cor principal da interface
              </p>
            </div>

            <div className="flex items-center gap-3">
              {accentOptions.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      accentColor: color,
                    }))
                  }
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    settings.accentColor === color
                      ? "border-teal-900 scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Cor ${color}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center gap-3">
            <CalendarDays className="text-teal-700" size={18} />
            <h2 className="text-xl font-bold text-gray-900">Agenda</h2>
          </div>

          <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Primeiro dia da semana
                </p>
              </div>
              <select
                value={settings.weekStart}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    weekStart: e.target.value as WeekStart,
                  }))
                }
                className="w-full rounded-lg bg-blue-50 px-4 py-2 text-sm text-gray-700 outline-none lg:w-40"
              >
                <option value="SEGUNDA">Segunda-feira</option>
                <option value="DOMINGO">Domingo</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Duração padrão da tarefa
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Tempo estimado ao criar uma nova tarefa
                </p>
              </div>
              <div className="flex items-center gap-2 justify-start lg:justify-end">
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={settings.taskDuration}
                  onChange={(e) =>
                    setSettings((current) => ({
                      ...current,
                      taskDuration: Number(e.target.value) || 45,
                    }))
                  }
                  className="w-20 rounded-lg bg-blue-50 px-3 py-2 text-center text-sm outline-none"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Mostrar fins de semana
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Exibir sábado e domingo no calendário
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    showWeekend: !current.showWeekend,
                  }))
                }
                className={`relative h-7 w-12 rounded-full transition ${settings.showWeekend ? "bg-teal-700" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    settings.showWeekend ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <p className="mb-4 text-sm font-medium text-gray-900">
                Ano académico
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-gray-500">
                    Data de início
                  </label>
                  <input
                    type="date"
                    value={settings.academicStart}
                    onChange={(e) =>
                      setSettings((current) => ({
                        ...current,
                        academicStart: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg bg-blue-50 px-4 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs text-gray-500">
                    Data de fim
                  </label>
                  <input
                    type="date"
                    value={settings.academicEnd}
                    onChange={(e) =>
                      setSettings((current) => ({
                        ...current,
                        academicEnd: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg bg-blue-50 px-4 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Disciplinas</h2>
              <p className="mt-1 text-sm text-gray-500">
                Ajuste as matérias da sua organização académica
              </p>
            </div>
            <Link
              href="/disciplinas"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Gerir disciplinas <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Resumo actual</h2>
              <p className="mt-1 text-sm text-gray-500">
                Estas definições ficam guardadas neste dispositivo.
              </p>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              <Check size={16} />
              Guardar alterações
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Tema
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {settings.themeMode}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Semana
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {weekStartLabel}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Tarefa
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {settings.taskDuration} minutos
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Weekend
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {settings.showWeekend ? "Visível" : "Oculto"}
              </p>
            </div>
          </div>

          {saved && (
            <p className="mt-4 text-sm font-medium text-teal-700">
              Definições guardadas com sucesso.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
