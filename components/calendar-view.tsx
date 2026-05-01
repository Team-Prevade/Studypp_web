"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Evento {
  id: string;
  data: Date;
  titulo: string;
  tipo?: string;
}

interface Avaliacao {
  id: string;
  data: Date;
  tipo: string;
  disciplina?: { nome: string };
}

interface Tarefa {
  id: string;
  prazo: Date;
  descricao: string;
}

interface CalendarViewProps {
  eventos: Evento[];
  avaliacoes: Avaliacao[];
  tarefas: Tarefa[];
  initialMonth: number;
  initialYear: number;
}

export function CalendarView({
  eventos,
  avaliacoes,
  tarefas,
  initialMonth,
  initialYear,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [filters, setFilters] = useState({
    tarefas: true,
    entrega: true,
    pessoal: true,
  });

  const monthNames = [
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
  ];

  const diasSemana = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

  // Get days in current month
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Calculate weeks to display
  const weeks = [];
  let dayCounter = 1;
  let prevMonthCounter = daysInPrevMonth - firstDay + 1;

  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      if (w === 0 && d < firstDay) {
        // Previous month days
        week.push({
          day: prevMonthCounter,
          isCurrentMonth: false,
          date: new Date(currentYear, currentMonth - 1, prevMonthCounter),
        });
        prevMonthCounter++;
      } else if (dayCounter <= daysInMonth) {
        // Current month days
        week.push({
          day: dayCounter,
          isCurrentMonth: true,
          date: new Date(currentYear, currentMonth, dayCounter),
        });
        dayCounter++;
      } else {
        // Next month days
        week.push({
          day: dayCounter - daysInMonth,
          isCurrentMonth: false,
          date: new Date(
            currentYear,
            currentMonth + 1,
            dayCounter - daysInMonth,
          ),
        });
        dayCounter++;
      }
    }
    weeks.push(week);
  }

  const getEventsForDay = (date: Date) => {
    const events = [];

    // Check tarefas
    if (filters.tarefas) {
      tarefas.forEach((t) => {
        const tDate = new Date(t.prazo);
        if (
          tDate.getDate() === date.getDate() &&
          tDate.getMonth() === date.getMonth() &&
          tDate.getFullYear() === date.getFullYear()
        ) {
          events.push({
            id: t.id,
            titulo: t.descricao,
            tipo: "tarefa",
            cor: "#8B5CF6",
          });
        }
      });
    }

    // Check avaliacoes/testes
    if (filters.entrega) {
      avaliacoes.forEach((a) => {
        const aDate = new Date(a.data);
        if (
          aDate.getDate() === date.getDate() &&
          aDate.getMonth() === date.getMonth() &&
          aDate.getFullYear() === date.getFullYear()
        ) {
          const tipo = a.tipo === "PROVA" ? "Prova" : "Exame";
          events.push({
            id: a.id,
            titulo: `${tipo} ${a.disciplina?.nome || ""}`,
            tipo: "avaliacao",
            cor: "#EF4444",
          });
        }
      });
    }

    // Check eventos pessoais
    if (filters.pessoal) {
      eventos.forEach((e) => {
        const eDate = new Date(e.data);
        if (
          eDate.getDate() === date.getDate() &&
          eDate.getMonth() === date.getMonth() &&
          eDate.getFullYear() === date.getFullYear()
        ) {
          events.push({
            id: e.id,
            titulo: e.titulo,
            tipo: "evento",
            cor: "#10B981",
          });
        }
      });
    }

    return events;
  };

  const proximoMes = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const mesAnterior = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Count upcoming events this month
  const totalEventos = eventos.length + avaliacoes.length + tarefas.length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {monthNames[currentMonth]} {currentYear}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Você tem {totalEventos} eventos próximos e {tarefas.length} prazos
              esta semana.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.tarefas}
              onChange={(e) =>
                setFilters({ ...filters, tarefas: e.target.checked })
              }
              className="w-4 h-4 rounded"
            />
            <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
            <span className="text-sm text-gray-700">Tarefa</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.entrega}
              onChange={(e) =>
                setFilters({ ...filters, entrega: e.target.checked })
              }
              className="w-4 h-4 rounded"
            />
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
            <span className="text-sm text-gray-700">Entrega</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.pessoal}
              onChange={(e) =>
                setFilters({ ...filters, pessoal: e.target.checked })
              }
              className="w-4 h-4 rounded"
            />
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-sm text-gray-700">Pessoal</span>
          </label>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={mesAnterior}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={proximoMes}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {diasSemana.map((dia) => (
            <div
              key={dia}
              className="text-center font-semibold text-gray-600 text-sm py-2"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIdx) => {
                const dayEvents = getEventsForDay(day.date);
                const isToday =
                  day.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={dayIdx}
                    className={`min-h-32 p-2 rounded-lg border transition-colors ${
                      day.isCurrentMonth
                        ? "bg-white border-gray-200 hover:border-blue-300"
                        : "bg-gray-50 border-gray-100"
                    } ${isToday ? "border-blue-600 bg-blue-50" : ""}`}
                  >
                    <div
                      className={`text-sm font-semibold ${
                        day.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                      } ${isToday ? "text-blue-600" : ""}`}
                    >
                      {day.day}
                    </div>

                    {/* Events */}
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs px-2 py-1 rounded text-white truncate hover:shadow-md transition-shadow cursor-pointer"
                          style={{ backgroundColor: event.cor }}
                          title={event.titulo}
                        >
                          {event.titulo}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 px-2 py-1">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
