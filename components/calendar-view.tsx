"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getCalendarEventsAction } from "@/lib/calendar-actions";
import {
  CALENDAR_EVENT_STYLE,
  getCalendarEventStyle,
} from "@/lib/calendar-event-style";
import {
  CalendarEventDialog,
  type CalendarEventRecord,
} from "@/components/calendar-event-dialog";

interface Evento {
  id: string;
  dataInicio: Date;
  dataFim?: Date | null;
  titulo: string;
  tipo: string;
  notas?: string | null;
  disciplina?: { id: string; nome: string; cor: string } | null;
}

interface Avaliacao {
  id: string;
  data: Date;
  tipo: string;
  disciplina?: { nome: string; cor?: string };
}

interface Tarefa {
  id: string;
  prazo: Date;
  titulo: string;
  disciplina?: { nome: string; cor?: string } | null;
}

interface DisciplinaOption {
  id: string;
  nome: string;
  cor: string;
}

interface CalendarViewProps {
  eventos: Evento[];
  avaliacoes: Avaliacao[];
  tarefas: Tarefa[];
  disciplinas: DisciplinaOption[];
  initialMonth: number;
  initialYear: number;
}

type CalendarItem = {
  key: string;
  titulo: string;
  cor: string;
  kind: "evento" | "avaliacao" | "tarefa";
  eventoId?: string;
};

function toDateInputValue(d: Date) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export function CalendarView({
  eventos: initialEventos,
  avaliacoes: initialAvaliacoes,
  tarefas: initialTarefas,
  disciplinas,
  initialMonth,
  initialYear,
}: CalendarViewProps) {
  const router = useRouter();
  const [eventos, setEventos] = useState(initialEventos);
  const [avaliacoes, setAvaliacoes] = useState(initialAvaliacoes);
  const [tarefas, setTarefas] = useState(initialTarefas);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogIntent, setDialogIntent] = useState<"create" | "detail" | null>(null);
  const [presetDateISO, setPresetDateISO] = useState<string | null>(null);
  const [detailEventForDialog, setDetailEventForDialog] = useState<CalendarEventRecord | null>(null);

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogIntent(null);
    setPresetDateISO(null);
    setDetailEventForDialog(null);
  };

  const openCreateFromToolbar = () => {
    setDialogIntent("create");
    setPresetDateISO(toDateInputValue(new Date()));
    setDetailEventForDialog(null);
    setDialogOpen(true);
  };

  const openDetailForEventId = (eventoId: string) => {
    const ev = eventos.find((e) => e.id === eventoId);
    if (!ev) return;
    const mapped: CalendarEventRecord = {
      id: ev.id,
      titulo: ev.titulo,
      tipo: ev.tipo,
      notas: ev.notas ?? null,
      disciplina: ev.disciplina ?? null,
      dataInicio: ev.dataInicio,
      dataFim: ev.dataFim ?? null,
    };
    setDetailEventForDialog(mapped);
    setPresetDateISO(null);
    setDialogIntent("detail");
    setDialogOpen(true);
  };

  const monthNames = useMemo(
    () => [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ],
    [],
  );

  const diasSemana = useMemo(() => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], []);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const weeks: { day: number; isCurrentMonth: boolean; date: Date }[][] = [];
  let dayCounter = 1;
  let prevMonthCounter = daysInPrevMonth - firstDay + 1;

  for (let w = 0; w < 6; w++) {
    const week: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
    for (let d = 0; d < 7; d++) {
      if (w === 0 && d < firstDay) {
        week.push({
          day: prevMonthCounter,
          isCurrentMonth: false,
          date: new Date(currentYear, currentMonth - 1, prevMonthCounter),
        });
        prevMonthCounter++;
      } else if (dayCounter <= daysInMonth) {
        week.push({
          day: dayCounter,
          isCurrentMonth: true,
          date: new Date(currentYear, currentMonth, dayCounter),
        });
        dayCounter++;
      } else {
        week.push({
          day: dayCounter - daysInMonth,
          isCurrentMonth: false,
          date: new Date(currentYear, currentMonth + 1, dayCounter - daysInMonth),
        });
        dayCounter++;
      }
    }
    weeks.push(week);
  }

  const isSameDay = (left: Date, right: Date) =>
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear();

  const normalizarResposta = (result: Awaited<ReturnType<typeof getCalendarEventsAction>>) => {
    if (!result.success || !result.data) {
      return;
    }

    setEventos(
      result.data.eventos.map((evento) => ({
        id: evento.id,
        dataInicio: new Date(evento.dataInicio),
        dataFim: evento.dataFim ? new Date(evento.dataFim) : null,
        titulo: evento.titulo,
        tipo: evento.tipo,
        notas: evento.notas ?? null,
        disciplina: evento.disciplina
          ? {
              id: evento.disciplina.id,
              nome: evento.disciplina.nome,
              cor: evento.disciplina.cor,
            }
          : null,
      })),
    );
    setAvaliacoes(
      result.data.avaliacoes.map((avaliacao) => ({
        id: avaliacao.id,
        data: new Date(avaliacao.data),
        tipo: avaliacao.tipo,
        disciplina: avaliacao.disciplina
          ? {
              nome: avaliacao.disciplina.nome,
              cor: avaliacao.disciplina.cor,
            }
          : undefined,
      })),
    );
    setTarefas(
      result.data.tarefas.map((tarefa) => ({
        id: tarefa.id,
        prazo: new Date(tarefa.prazo as Date),
        titulo: tarefa.titulo,
        disciplina: tarefa.disciplina
          ? {
              nome: tarefa.disciplina.nome,
              cor: tarefa.disciplina.cor,
            }
          : null,
      })),
    );
  };

  const carregarMes = (year: number, month: number) => {
    startTransition(async () => {
      const result = await getCalendarEventsAction(year, month);
      normalizarResposta(result);
    });
  };

  const itemsForDay = (date: Date): CalendarItem[] => {
    const list: CalendarItem[] = [];

    avaliacoes.forEach((avaliacao) => {
      if (!isSameDay(new Date(avaliacao.data), date)) return;
      list.push({
        key: `avaliacao-${avaliacao.id}`,
        titulo: `${avaliacao.tipo.replace(/_/g, " ")} ${avaliacao.disciplina?.nome ?? ""}`.trim(),
        cor: "#F97316",
        kind: "avaliacao",
      });
    });

    tarefas.forEach((tarefa) => {
      if (!isSameDay(new Date(tarefa.prazo), date)) return;
      list.push({
        key: `tarefa-${tarefa.id}`,
        titulo: tarefa.titulo,
        cor: "#14B8A6",
        kind: "tarefa",
      });
    });

    eventos.forEach((evento) => {
      const style = getCalendarEventStyle(evento.tipo);
      const inicio = new Date(
        evento.dataInicio.getFullYear(),
        evento.dataInicio.getMonth(),
        evento.dataInicio.getDate(),
      );
      const fim = evento.dataFim
        ? new Date(evento.dataFim.getFullYear(), evento.dataFim.getMonth(), evento.dataFim.getDate())
        : inicio;
      const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (current < inicio || current > fim) return;
      list.push({
        key: `evento-${evento.id}`,
        titulo: evento.titulo,
        cor: style.color,
        kind: "evento",
        eventoId: evento.id,
      });
    });

    return list;
  };

  const proximoMes = () => {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
    carregarMes(nextYear, nextMonth);
  };

  const mesAnterior = () => {
    const nextMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const nextYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
    carregarMes(nextYear, nextMonth);
  };

  const irParaHoje = () => {
    const hoje = new Date();
    setCurrentMonth(hoje.getMonth());
    setCurrentYear(hoje.getFullYear());
    carregarMes(hoje.getFullYear(), hoje.getMonth());
  };

  const navigateToDay = (date: Date) => {
    router.push(`/calendario/dia/${toDateInputValue(date)}`);
  };

  const totalEventos = eventos.length + avaliacoes.length + tarefas.length;

  return (
    <>
      <div className="w-full">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {monthNames[currentMonth]} {currentYear}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{totalEventos} itens neste mês.</p>
          </div>
          <button
            type="button"
            onClick={openCreateFromToolbar}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo evento
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={mesAnterior}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={irParaHoje}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-100"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={proximoMes}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-6 text-sm text-gray-600">
          {Object.entries(CALENDAR_EVENT_STYLE).map(([tipo, style]) => (
            <span key={tipo} className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: style.color }}
                aria-hidden
              />
              {style.label}
            </span>
          ))}
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2">
          {diasSemana.map((dia) => (
            <div key={dia} className="py-2 text-center text-xs font-medium text-gray-600">
              {dia}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((dayCell, dayIdx) => {
                const dayItems = itemsForDay(dayCell.date);
                const isToday = dayCell.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    role="presentation"
                    key={`${weekIdx}-${dayIdx}-${dayCell.date.toISOString()}`}
                    tabIndex={-1}
                    title="Duplo clique para abrir este dia"
                    onDoubleClick={() => navigateToDay(dayCell.date)}
                    className={`min-h-28 rounded-lg border p-2 transition-colors duration-150 ${
                      dayCell.isCurrentMonth
                        ? "border-gray-200 bg-white"
                        : "border-gray-100 bg-gray-50"
                    } ${isToday ? "border-blue-600 bg-blue-50" : ""}`}
                  >
                    <span
                      className={`inline-block px-1 text-sm font-semibold tabular-nums ${
                        dayCell.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                      } ${isToday ? "text-blue-700" : ""}`}
                    >
                      {dayCell.day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayItems.slice(0, 2).map((item) =>
                        item.kind === "evento" ? (
                          <button
                            key={item.key}
                            type="button"
                            className="w-full truncate rounded px-2 py-1 text-left text-xs text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: item.cor }}
                            title={item.titulo}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (item.eventoId) openDetailForEventId(item.eventoId);
                            }}
                          >
                            {item.titulo}
                          </button>
                        ) : (
                          <div
                            key={item.key}
                            className="truncate rounded px-2 py-1 text-xs text-white"
                            style={{ backgroundColor: item.cor }}
                            title={item.titulo}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            {item.titulo}
                          </div>
                        ),
                      )}
                      {dayItems.length > 2 && (
                        <p className="px-2 text-xs text-gray-500">+{dayItems.length - 2} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {isPending && <p className="mt-4 text-xs text-gray-500">A atualizar mês...</p>}
      </div>

      <CalendarEventDialog
        open={dialogOpen}
        onClose={closeDialog}
        disciplinas={disciplinas}
        intent={dialogIntent}
        presetDateISO={presetDateISO}
        detailEvent={detailEventForDialog}
        onSuccess={() => carregarMes(currentYear, currentMonth)}
      />
    </>
  );
}
