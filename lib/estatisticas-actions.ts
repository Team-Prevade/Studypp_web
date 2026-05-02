"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getInicioDaSemana } from "@/lib/date-utils";

export type StatisticsPeriod = "SEMANA" | "MES" | "SEMESTRE";

export type StatisticsSnapshot = {
  periodo: StatisticsPeriod;
  totalMinutos: number;
  totalMinutosAnterior: number;
  variationPercent: number;
  streakDays: number;
  tarefasFeitas: number;
  tarefasPendentes: number;
  tarefasFeitasPercent: number;
  weeklyStudy: { dia: string; minutos: number }[];
  heatmap: { date: string; minutes: number; level: number }[];
  gradeTrend: { label: string; media: number }[];
  focusByDiscipline: {
    nome: string;
    cor: string;
    minutos: number;
    hoursLabel: string;
  }[];
};

export type StatisticsData = {
  snapshots: Record<StatisticsPeriod, StatisticsSnapshot>;
  currentPeriod: StatisticsPeriod;
};

const dayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const monthLabels = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function minutesBetween(
  start: Date,
  end?: Date | null,
  fallback?: number | null,
) {
  if (start && end) {
    return Math.max(
      0,
      Math.floor((end.getTime() - start.getTime()) / 1000 / 60),
    );
  }
  return fallback || 0;
}

function getLabelForDay(date: Date) {
  return dayLabels[(date.getDay() + 6) % 7];
}

function getWeeklyBuckets(
  period: StatisticsPeriod,
  sessions: {
    iniciadaEm: Date;
    terminadaEm: Date | null;
    duracaoReal: number | null;
    duracaoPrevista: number;
  }[],
  start: Date,
) {
  if (period === "SEMANA") {
    return dayLabels.map((label, index) => {
      const dayMinutes = sessions.reduce((sum, session) => {
        const dayIndex = (new Date(session.iniciadaEm).getDay() + 6) % 7;
        if (dayIndex !== index) return sum;
        return (
          sum +
          minutesBetween(
            session.iniciadaEm,
            session.terminadaEm,
            session.duracaoReal || session.duracaoPrevista,
          )
        );
      }, 0);
      return { dia: label, minutos: dayMinutes };
    });
  }

  const bucketCount = 7;
  const totalDays = period === "MES" ? 30 : 180;
  const bucketSize = Math.ceil(totalDays / bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start);
    bucketStart.setDate(bucketStart.getDate() + index * bucketSize);
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketEnd.getDate() + bucketSize - 1);
    bucketEnd.setHours(23, 59, 59, 999);

    const minutos = sessions
      .filter((session) => {
        const sessionDate = new Date(session.iniciadaEm);
        return sessionDate >= bucketStart && sessionDate <= bucketEnd;
      })
      .reduce(
        (sum, session) =>
          sum +
          minutesBetween(
            session.iniciadaEm,
            session.terminadaEm,
            session.duracaoReal || session.duracaoPrevista,
          ),
        0,
      );

    const label =
      period === "MES"
        ? `S${index + 1}`
        : period === "SEMESTRE"
          ? monthLabels[bucketStart.getMonth()]
          : getLabelForDay(bucketStart);

    return { dia: label, minutos };
  });
}

function calculateSnapshot(
  period: StatisticsPeriod,
  allSessions: {
    iniciadaEm: Date;
    terminadaEm: Date | null;
    duracaoReal: number | null;
    duracaoPrevista: number;
    disciplina?: { nome: string; cor: string } | null;
  }[],
  allSessionsPrevious: {
    iniciadaEm: Date;
    terminadaEm: Date | null;
    duracaoReal: number | null;
    duracaoPrevista: number;
  }[],
  tasks: { status: string }[],
  grades: { nota: number | null; data: Date }[],
  disciplines: { nome: string; cor: string }[],
  now = new Date(),
): StatisticsSnapshot {
  const { start, end, previousStart, previousEnd } = getPeriodRange(
    period,
    now,
  );

  const sessionsCurrent = allSessions.filter((session) => {
    const date = new Date(session.iniciadaEm);
    return date >= start && date <= end;
  });

  const sessionsPrevious = allSessionsPrevious.filter((session) => {
    const date = new Date(session.iniciadaEm);
    return date >= previousStart && date <= previousEnd;
  });

  const minutesCurrent = sessionsCurrent.reduce(
    (sum, session) =>
      sum +
      minutesBetween(
        session.iniciadaEm,
        session.terminadaEm,
        session.duracaoReal || session.duracaoPrevista,
      ),
    0,
  );

  const minutesPrevious = sessionsPrevious.reduce(
    (sum, session) =>
      sum +
      minutesBetween(
        session.iniciadaEm,
        session.terminadaEm,
        session.duracaoReal || session.duracaoPrevista,
      ),
    0,
  );

  const variationPercent =
    minutesPrevious > 0
      ? Math.round(((minutesCurrent - minutesPrevious) / minutesPrevious) * 100)
      : minutesCurrent > 0
        ? 100
        : 0;

  const completedTasks = tasks.filter(
    (task) => task.status === "CONCLUIDA",
  ).length;
  const pendingTasks = tasks.length - completedTasks;
  const tasksCompletedPercent =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const streakDays = calculateStreak(
    sessionsCurrent.map((session) => session.iniciadaEm),
  );
  const weeklyStudy = getWeeklyBuckets(period, sessionsCurrent, start);
  const heatmap = buildHeatmap(sessionsCurrent);

  const gradeTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthGrades = grades.filter((grade) => {
      const gradeDate = new Date(grade.data);
      return gradeDate.getMonth() === month && gradeDate.getFullYear() === year;
    });
    const average =
      monthGrades.length > 0
        ? monthGrades.reduce((sum, grade) => sum + (grade.nota || 0), 0) /
          monthGrades.length
        : 0;

    return {
      label: monthLabels[month],
      media: Math.round(average * 10) / 10,
    };
  });

  const focusByDiscipline = disciplines
    .map((discipline) => {
      const disciplineSessions = sessionsCurrent.filter(
        (session) => session.disciplina?.nome === discipline.nome,
      );
      const minutos = disciplineSessions.reduce(
        (sum, session) =>
          sum +
          minutesBetween(
            session.iniciadaEm,
            session.terminadaEm,
            session.duracaoReal || session.duracaoPrevista,
          ),
        0,
      );

      return {
        nome: discipline.nome,
        cor: discipline.cor,
        minutos,
        hoursLabel: `${Math.floor(minutos / 60)}h ${minutos % 60}m`,
      };
    })
    .sort((a, b) => b.minutos - a.minutos)
    .slice(0, 3);

  return {
    periodo: period,
    totalMinutos: minutesCurrent,
    totalMinutosAnterior: minutesPrevious,
    variationPercent,
    streakDays,
    tarefasFeitas: completedTasks,
    tarefasPendentes: pendingTasks,
    tarefasFeitasPercent: tasksCompletedPercent,
    weeklyStudy,
    heatmap,
    gradeTrend,
    focusByDiscipline,
  };
}

function getPeriodRange(period: StatisticsPeriod, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);

  if (period === "SEMANA") {
    const weekStart = getInicioDaSemana(now);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const previousStart = new Date(weekStart);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(weekEnd);
    previousEnd.setDate(previousEnd.getDate() - 7);
    return { start: weekStart, end: weekEnd, previousStart, previousEnd };
  }

  if (period === "SEMESTRE") {
    start.setMonth(start.getMonth() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const previousStart = new Date(start);
    previousStart.setMonth(previousStart.getMonth() - 6);
    const previousEnd = new Date(start);
    previousEnd.setMilliseconds(-1);
    return { start, end, previousStart, previousEnd };
  }

  start.setMonth(start.getMonth() - 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  const previousStart = new Date(start);
  previousStart.setMonth(previousStart.getMonth() - 1);
  const previousEnd = new Date(start);
  previousEnd.setMilliseconds(-1);
  return { start, end, previousStart, previousEnd };
}

function calculateStreak(sessionDates: Date[]) {
  const uniqueDays = new Set(
    sessionDates.map((date) => new Date(date).toDateString()),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (uniqueDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildHeatmap(
  sessions: {
    iniciadaEm: Date;
    terminadaEm: Date | null;
    duracaoReal: number | null;
    duracaoPrevista: number;
  }[],
  days = 30,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const map = new Map<string, number>();

  sessions.forEach((session) => {
    const key = new Date(session.iniciadaEm).toISOString().slice(0, 10);
    map.set(
      key,
      (map.get(key) || 0) +
        minutesBetween(
          session.iniciadaEm,
          session.terminadaEm,
          session.duracaoReal || session.duracaoPrevista,
        ),
    );
  });

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    const minutes = map.get(key) || 0;
    let level = 0;
    if (minutes > 0 && minutes < 30) level = 1;
    else if (minutes < 60) level = 2;
    else if (minutes < 120) level = 3;
    else if (minutes >= 120) level = 4;

    return {
      date: key,
      minutes,
      level,
    };
  });
}

export async function getStatisticsAction(period: StatisticsPeriod = "MES") {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado", data: null };
    }

    const user = await prisma.utilizador.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "Utilizador não encontrado", data: null };
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [sessions, tasks, grades, disciplines] = await Promise.all([
      prisma.sessaoEstudo.findMany({
        where: {
          utilizadorId: user.id,
          tipo: "ESTUDO",
          status: "CONCLUIDA",
          iniciadaEm: { gte: sixMonthsAgo },
        },
        include: {
          disciplina: {
            select: { nome: true, cor: true },
          },
        },
      }),
      prisma.tarefa.findMany({
        where: { utilizadorId: user.id },
        select: { id: true, status: true, createdAt: true, concluidaEm: true },
      }),
      prisma.avaliacao.findMany({
        where: {
          utilizadorId: user.id,
          nota: { not: null },
          data: { gte: sixMonthsAgo },
        },
        select: { nota: true, data: true },
        orderBy: { data: "asc" },
      }),
      prisma.disciplina.findMany({
        where: { utilizadorId: user.id },
        select: { id: true, nome: true, cor: true },
      }),
    ]);

    const snapshots: Record<StatisticsPeriod, StatisticsSnapshot> = {
      SEMANA: calculateSnapshot(
        "SEMANA",
        sessions,
        sessions,
        tasks,
        grades,
        disciplines,
        new Date(),
      ),
      MES: calculateSnapshot(
        "MES",
        sessions,
        sessions,
        tasks,
        grades,
        disciplines,
        new Date(),
      ),
      SEMESTRE: calculateSnapshot(
        "SEMESTRE",
        sessions,
        sessions,
        tasks,
        grades,
        disciplines,
        new Date(),
      ),
    };

    return {
      success: true,
      data: {
        snapshots,
        currentPeriod: period,
      },
    };
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return {
      success: false,
      error: "Erro ao carregar estatísticas",
      data: null,
    };
  }
}
