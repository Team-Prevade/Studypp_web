"use client";

import { useMemo, useState } from "react";
import { BarChart3, Flame } from "lucide-react";
import type {
  StatisticsData,
  StatisticsPeriod,
  StatisticsSnapshot,
} from "@/lib/estatisticas-actions";

interface StatisticsViewProps {
  data: StatisticsData;
}

const periodLabels: Record<StatisticsPeriod, string> = {
  SEMANA: "Semana",
  MES: "Mes",
  SEMESTRE: "Semestre",
};

function heatClass(level: number): string {
  if (level <= 0) return "bg-blue-100";
  if (level === 1) return "bg-blue-200";
  if (level === 2) return "bg-teal-300";
  if (level === 3) return "bg-teal-500";
  return "bg-teal-700";
}

function barHeight(minutes: number, maxMinutes: number): number {
  if (maxMinutes <= 0) return 16;
  return Math.max(16, Math.round((minutes / maxMinutes) * 140));
}

function TrendChart({ snapshot }: { snapshot: StatisticsSnapshot }) {
  const path =
    "M 0 120 " +
    snapshot.gradeTrend
      .map((point, index) => {
        const x = (index / Math.max(snapshot.gradeTrend.length - 1, 1)) * 320;
        const y = 120 - (point.media / 20) * 100;
        return `L ${x} ${y}`;
      })
      .join(" ");

  return (
    <svg
      className="h-40 w-full"
      viewBox="0 0 320 140"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="gradeLine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#gradeLine)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SnapshotGrid({ snapshot }: { snapshot: StatisticsSnapshot }) {
  const maxWeekly = Math.max(...snapshot.weeklyStudy.map((i) => i.minutos), 0);
  const maxFocus = Math.max(
    ...snapshot.focusByDiscipline.map((i) => i.minutos),
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Ofensiva atual
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold text-orange-600">
                {snapshot.streakDays}
              </span>
              <span className="pb-1 text-sm text-gray-500">dias seguidos</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Flame size={22} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Mapa de Produtividade
          </h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-gray-600">
            ultimos 30 dias
          </span>
        </div>
        <div className="rounded-xl bg-blue-100/70 p-6 text-center text-sm text-gray-600">
          Productivity Heatmap Visualization
        </div>
        <div className="mt-4 grid grid-cols-10 gap-2">
          {snapshot.heatmap.map((item) => (
            <div
              key={item.date}
              className={`h-5 rounded-md ${heatClass(item.level)}`}
              title={`${item.date} - ${item.minutes} min`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Horas de Estudo</h2>
            <p className="text-sm text-gray-500">Tempo total focado por dia</p>
          </div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {snapshot.variationPercent >= 0
              ? `+${snapshot.variationPercent}% vs ant.`
              : `${snapshot.variationPercent}% vs ant.`}
          </span>
        </div>
        <div className="flex h-56 items-end gap-3 rounded-xl bg-gray-50 px-4 py-6">
          {snapshot.weeklyStudy.map((item) => (
            <div
              key={item.dia}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div
                className="w-full rounded-t-xl bg-teal-700/40"
                style={{ height: `${barHeight(item.minutos, maxWeekly)}px` }}
              />
              <span className="text-xs text-gray-500">{item.dia}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Conclusao de Tarefas
        </h2>
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative h-40 w-40">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#6d28d9"
                strokeWidth="10"
                strokeDasharray={`${snapshot.tarefasFeitasPercent * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-bold text-gray-900">
                {snapshot.tarefasFeitasPercent}%
              </span>
              <span className="text-sm text-gray-500">Concluidas</span>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-gray-600">Feitas</span>
            <span className="font-semibold text-gray-900">
              {snapshot.tarefasFeitas}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-gray-600">Pendentes</span>
            <span className="font-semibold text-gray-900">
              {snapshot.tarefasPendentes}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Tendencia de Notas
        </h2>
        <div className="rounded-xl bg-blue-100/70 p-4">
          <TrendChart snapshot={snapshot} />
        </div>
        <div className="mt-4 grid grid-cols-6 gap-2 text-center text-xs text-gray-500">
          {snapshot.gradeTrend.map((point) => (
            <div key={point.label}>
              <div className="font-semibold text-gray-800">{point.label}</div>
              <div>{point.media > 0 ? point.media.toFixed(1) : "-"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Foco por Disciplina
        </h2>
        <div className="space-y-4">
          {snapshot.focusByDiscipline.map((item) => (
            <div key={item.nome}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">{item.nome}</span>
                <span className="text-gray-500">{item.hoursLabel}</span>
              </div>
              <div className="h-2 rounded-full bg-blue-100">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${maxFocus > 0 ? (item.minutos / maxFocus) * 100 : 0}%`,
                    backgroundColor: item.cor,
                  }}
                />
              </div>
            </div>
          ))}
          {snapshot.focusByDiscipline.length === 0 ? (
            <p className="text-sm text-gray-500">
              Sem sessoes concluidas neste periodo.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function StatisticsView({ data }: StatisticsViewProps) {
  const [period, setPeriod] = useState<StatisticsPeriod>(data.currentPeriod);
  const snapshot = data.snapshots[period];
  const currentLabel = useMemo(() => periodLabels[period], [period]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Estatísticas</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Visualize seu progresso e identifique padroes de estudo para
            otimizar sua rotina academica.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-gray-100 p-1 shadow-sm">
          {(Object.keys(periodLabels) as StatisticsPeriod[]).map((item) => {
            const active = period === item;
            return (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={
                  active
                    ? "rounded-lg bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm"
                    : "rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                }
              >
                {periodLabels[item]}
              </button>
            );
          })}
        </div>
      </div>

      <SnapshotGrid snapshot={snapshot} />

      <div className="mt-6 flex items-center justify-end gap-2 text-xs text-gray-500">
        <BarChart3 size={14} />
        Periodo atual: {currentLabel}
      </div>
    </div>
  );
}
