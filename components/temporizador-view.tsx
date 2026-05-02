"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BookOpen,
  Cloud,
  Info,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { saveSessaoEstudoAction } from "@/lib/temporizador-actions";
import type { TemporizadorData } from "@/lib/temporizador-actions";

interface TemporizadorViewProps {
  data: NonNullable<TemporizadorData>;
}

type Mode = "ESTUDO" | "PAUSA_CURTA" | "PAUSA_LONGA";

const modeCopy: Record<Mode, string> = {
  ESTUDO: "Estudo",
  PAUSA_CURTA: "Pausa curta",
  PAUSA_LONGA: "Pausa longa",
};

const mindfulQuote =
  "Concentra todos os teus pensamentos no trabalho que tens em mãos. A luz só aquece quando encontra foco.";

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function clampDuration(value: number) {
  if (Number.isNaN(value)) return 1;
  return Math.min(180, Math.max(1, Math.round(value)));
}

function makeLocalSession(data: any) {
  return {
    ...data,
    iniciadaEm: new Date(data.iniciadaEm).toISOString(),
    terminadaEm: data.terminadaEm ? new Date(data.terminadaEm).toISOString() : null,
  };
}

export function TemporizadorView({ data }: TemporizadorViewProps) {
  const [mode, setMode] = useState<Mode>("ESTUDO");
  const [durations, setDurations] = useState<Record<Mode, number>>({
    ESTUDO: 25,
    PAUSA_CURTA: 5,
    PAUSA_LONGA: 15,
  });
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState(data.disciplinas[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [studyTimeToday, setStudyTimeToday] = useState(data.totalMinutosHoje);
  const [studyTimeWeek, setStudyTimeWeek] = useState(data.totalMinutosSemana);
  const [sessionsToday, setSessionsToday] = useState(data.sessoesHoje.map(makeLocalSession));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSecondsLeft(durations[mode] * 60);
    setRunning(false);
  }, [mode, durations]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && running) setRunning(false);
  }, [secondsLeft, running]);

  const currentDiscipline = data.disciplinas.find((disciplina) => disciplina.id === selectedDisciplineId) || data.disciplinas[0];
  const totalSeconds = durations[mode] * 60;
  const elapsedSeconds = totalSeconds - secondsLeft;
  const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const canSave = mode === "ESTUDO" && elapsedSeconds >= 60 && Boolean(selectedDisciplineId);
  const saveHint = !selectedDisciplineId
    ? "Escolhe uma disciplina para guardar."
    : mode !== "ESTUDO"
      ? "Pausas ajudam no descanso, mas não contam como tempo de foco."
      : elapsedSeconds < 60
        ? `Podes guardar após 1 minuto de foco. Faltam ${Math.max(0, 60 - elapsedSeconds)}s.`
        : "Já podes guardar esta sessão como tempo de foco.";
  const progress = Math.max(0, 1 - secondsLeft / totalSeconds);
  const weeklyGoal = 20 * 60;
  const weeklyProgress = Math.min(100, Math.round((studyTimeWeek / weeklyGoal) * 100));

  const updatedWeeklyOverview = useMemo(() => {
    const overview = [...data.weeklyOverview];
    const todayIndex = (new Date().getDay() + 6) % 7;
    if (overview[todayIndex]) {
      const originalToday = data.weeklyOverview[todayIndex]?.minutos ?? 0;
      overview[todayIndex] = {
        ...overview[todayIndex],
        minutos: originalToday + Math.max(0, studyTimeToday - data.totalMinutosHoje),
      };
    }
    return overview;
  }, [data.totalMinutosHoje, data.weeklyOverview, studyTimeToday]);

  const showFeedbackMessage = (message: string) => {
    toast.success(message);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const updateDuration = (key: Mode, value: number) => {
    setDurations((current) => ({ ...current, [key]: clampDuration(value) }));
  };

  const saveSession = () => {
    if (!canSave) {
      setError(saveHint);
      return;
    }

    const minutes = elapsedMinutes;
    startTransition(async () => {
      const result = await saveSessaoEstudoAction(
        selectedDisciplineId,
        durations.ESTUDO,
        minutes,
        notes,
      );

      if (!result.success || !result.data) {
        setError(result.error || "Não foi possível guardar a sessão.");
        return;
      }

      const saved = makeLocalSession({
        ...result.data,
        disciplina: currentDiscipline ?? null,
      });
      setSessionsToday((current) => [saved, ...current]);
      setStudyTimeToday((current) => current + minutes);
      setStudyTimeWeek((current) => current + minutes);
      setNotes("");
      resetTimer();
      setError(null);
      showFeedbackMessage("Sessão guardada.");
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Temporizador de foco</h1>
          <p className="mt-2 text-sm text-gray-600">Um ambiente simples para estudar com calma e presença.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          <Sparkles className="h-4 w-4" />
          Hoje: {formatMinutes(studyTimeToday)}
        </div>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mx-auto mb-10 flex w-fit rounded-full bg-blue-50 p-1 text-sm">
              {(Object.keys(modeCopy) as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === item ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:text-blue-700"
                  }`}
                >
                  {modeCopy[item]} ({durations[item]}m)
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center">
              <TimerRing
                progress={progress}
                time={formatTimer(secondsLeft)}
                caption={mode === "ESTUDO" ? `Focado em ${currentDiscipline?.nome || "estudo"}` : modeCopy[mode]}
                color={currentDiscipline?.cor || "#1D4ED8"}
              />

              <div className="mt-9 w-full max-w-lg">
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowInfo((value) => !value)}
                      className="font-semibold text-blue-800"
                    >
                      Quando o tempo conta como foco?
                    </button>
                    {showInfo ? (
                      <div className="mt-2 space-y-1 text-xs leading-5 text-blue-900/80">
                        <p>Conta apenas no modo Estudo, com uma disciplina selecionada.</p>
                        <p>A sessão pode ser guardada depois de pelo menos 1 minuto de foco.</p>
                        <p>Pausas curta e longa ajudam no descanso, mas não entram no total de estudo.</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-blue-900/70">{saveHint}</p>
                    )}
                  </div>
                </div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Disciplina
                </label>
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3">
                  <BookOpen className="h-4 w-4 text-blue-700" />
                  <select
                    value={selectedDisciplineId}
                    onChange={(event) => setSelectedDisciplineId(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none"
                  >
                    {data.disciplinas.length === 0 ? (
                      <option value="">Sem disciplinas</option>
                    ) : (
                      data.disciplinas.map((disciplina) => (
                        <option key={disciplina.id} value={disciplina.id}>
                          {disciplina.nome}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {showSettings ? (
                  <div className="mt-3 space-y-3 rounded-lg border border-blue-100 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <DurationInput label="Estudo" value={durations.ESTUDO} onChange={(value) => updateDuration("ESTUDO", value)} />
                      <DurationInput label="Pausa curta" value={durations.PAUSA_CURTA} onChange={(value) => updateDuration("PAUSA_CURTA", value)} />
                      <DurationInput label="Pausa longa" value={durations.PAUSA_LONGA} onChange={(value) => updateDuration("PAUSA_LONGA", value)} />
                    </div>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Notas rápidas sobre o foco, tópicos ou bloqueios..."
                      className="h-24 w-full resize-none rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                ) : null}

                <p className={`mt-3 text-center text-xs font-medium ${canSave ? "text-blue-700" : "text-gray-500"}`}>
                  {saveHint}
                </p>

                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="rounded-full bg-blue-50 p-3 text-blue-700 transition hover:bg-blue-100"
                    title="Reiniciar"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRunning((value) => !value)}
                    className="inline-flex min-w-44 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                  >
                    {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    {running ? "Pausar sessão" : "Iniciar sessão"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings((value) => !value)}
                    className="rounded-full bg-blue-50 p-3 text-blue-700 transition hover:bg-blue-100"
                    title="Configurar tempos e notas"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={saveSession}
                    disabled={isPending || !canSave}
                    className="rounded-full bg-blue-50 p-3 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Guardar sessão"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-blue-50 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">Sessões de hoje</h2>
            <div className="space-y-3">
              {sessionsToday.length === 0 ? (
                <div className="rounded-lg bg-white p-4 text-sm text-gray-500">
                  Nenhuma sessão guardada hoje.
                </div>
              ) : (
                sessionsToday.slice(0, 5).map((sessao) => (
                  <div key={sessao.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 h-10 w-1 rounded-full"
                        style={{ backgroundColor: sessao.disciplina?.cor || "#1D4ED8" }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {sessao.disciplina?.nome || "Sessão de estudo"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(sessao.iniciadaEm)} - {formatTime(sessao.terminadaEm || sessao.iniciadaEm)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-blue-700 px-2 py-1 text-xs font-semibold text-white">
                      {sessao.duracaoReal || sessao.duracaoPrevista}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Resumo semanal</h2>
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </div>

            <div className="mb-5 flex h-56 items-end justify-between gap-2 border-b border-blue-50 pb-3">
              {updatedWeeklyOverview.map((item) => {
                const height = Math.max(10, Math.min(100, (item.minutos / 180) * 100));
                return (
                  <div key={item.dia} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[11px] font-semibold text-blue-700">{item.minutos ? formatMinutes(item.minutos) : ""}</span>
                    <div className="flex h-36 w-full items-end justify-center">
                      <span
                        className="w-3 rounded-full bg-blue-700/80"
                        style={{ height: `${height}%`, opacity: item.minutos ? 1 : 0.18 }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500">{item.dia}</span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">Meta semanal</span>
                <span className="text-gray-700">{formatMinutes(studyTimeWeek)} / 20h</span>
              </div>
              <div className="h-2 rounded-full bg-white">
                <div className="h-full rounded-full bg-blue-700" style={{ width: `${weeklyProgress}%` }} />
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-blue-100 p-5 text-blue-950 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-bold">
              <Cloud className="h-5 w-5" />
              Momento mindful
            </div>
            <p className="text-sm leading-6 text-blue-950/80">{mindfulQuote}</p>
            <p className="mt-4 text-xs text-blue-950/60">- Alexander Graham Bell</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DurationInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-500">{label}</span>
      <input
        type="number"
        min={1}
        max={180}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
      />
    </label>
  );
}

function TimerRing({
  progress,
  time,
  caption,
  color,
}: {
  progress: number;
  time: string;
  caption: string;
  color: string;
}) {
  const radius = 103;
  const circumference = 2 * Math.PI * radius;
  const dash = progress * circumference;

  return (
    <div className="relative h-72 w-72">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240">
        <circle cx="120" cy="120" r={radius} fill="none" stroke="#E0E7FF" strokeWidth="9" />
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-5xl font-bold text-gray-900">{time}</p>
        <p className="mt-2 max-w-48 truncate text-sm text-gray-500">{caption}</p>
      </div>
    </div>
  );
}
