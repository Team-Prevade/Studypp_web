"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Edit2, X } from "lucide-react";
import {
  formatarHora,
  getNomeDia,
  getInicioDaSemana,
} from "@/lib/date-utils";

interface Disciplina {
  id: string;
  nome: string;
  cor: string;
}

interface Aula {
  id: string;
  disciplinaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  disciplina: Disciplina;
}

interface TimetableProps {
  initialStartDate: Date;
  initialAulas: Aula[];
  horas: string[];
}

export function TimetableView({
  initialStartDate,
  initialAulas,
  horas,
}: TimetableProps) {
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(initialStartDate)
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [aulas, setAulas] = useState<Aula[]>(initialAulas);

  const diasSemana = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"];
  const diasNomes = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

  const semanaAtual = getInicioDaSemana(currentDate);
  const diasDatas = diasSemana.map((_, i) => {
    const data = new Date(semanaAtual);
    data.setDate(data.getDate() + i);
    return data;
  });

  const proximaSemana = () => {
    const nova = new Date(currentDate);
    nova.setDate(nova.getDate() + 7);
    setCurrentDate(nova);
  };

  const semanaAnterior = () => {
    const nova = new Date(currentDate);
    nova.setDate(nova.getDate() - 7);
    setCurrentDate(nova);
  };

  const getAulasDoDia = (dia: string) => {
    return aulas.filter((a) => a.diaSemana === dia);
  };

  const aulaFitsDia = (dia: string, horaInicio: string, horaFim: string) => {
    return aulas.filter(
      (a) =>
        a.diaSemana === dia &&
        !((a.horaFim <= horaInicio || a.horaInicio >= horaFim))
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Horário Semanal</h1>
            <p className="text-gray-600 text-sm">
              Seu cronograma organizado para a semana
            </p>
          </div>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isEditMode ? (
              <>
                <X className="w-4 h-4" />
                Sair Edição
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Modo Edição
              </>
            )}
          </button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={semanaAnterior}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {diasDatas[0].getDate()} {getMonthName(diasDatas[0].getMonth())} -{" "}
              {diasDatas[4].getDate()} {getMonthName(diasDatas[4].getMonth())}
            </p>
          </div>

          <button
            onClick={proximaSemana}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-20">
                Hora
              </th>
              {diasNomes.map((dia, i) => (
                <th key={dia} className="px-4 py-3 text-center border-l border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 uppercase">
                    {dia}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {diasDatas[i].getDate()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horas.map((hora, idx) => {
              const proximaHora =
                idx < horas.length - 1
                  ? horas[idx + 1]
                  : `${String(parseInt(hora.split(":")[0]) + 1).padStart(2, "0")}:00`;

              return (
                <tr key={hora} className="border-b border-gray-200 h-20">
                  <td className="px-4 py-3 text-right text-xs font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                    {formatarHora(hora)}
                  </td>

                  {diasSemana.map((dia) => (
                    <td
                      key={`${dia}-${hora}`}
                      className="px-3 py-2 border-l border-gray-200 align-top relative"
                    >
                      {/* Display classes that start at this time */}
                      {getAulasDoDia(dia)
                        .filter((a) => a.horaInicio === hora)
                        .map((aula) => {
                          // Calculate height based on duration
                          const [startH, startM] = aula.horaInicio.split(":").map(Number);
                          const [endH, endM] = aula.horaFim.split(":").map(Number);
                          const duracao = (endH - startH) * 60 + (endM - startM);
                          const altura = Math.max(20, (duracao / 60) * 80);

                          return (
                            <div
                              key={aula.id}
                              className="p-2 rounded text-white text-xs font-semibold mb-1 hover:shadow-lg transition-shadow cursor-pointer group relative"
                              style={{
                                backgroundColor: aula.disciplina.cor,
                                minHeight: `${altura}px`,
                              }}
                            >
                              <div className="line-clamp-2">
                                {aula.disciplina.nome}
                              </div>
                              <div className="text-xs opacity-90 mt-0.5">
                                {formatarHora(aula.horaInicio)} -{" "}
                                {formatarHora(aula.horaFim)}
                              </div>

                              {isEditMode && (
                                <button
                                  onClick={() => {
                                    // Remove aula
                                    setAulas(aulas.filter((a) => a.id !== aula.id));
                                  }}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 rounded p-1 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {aulas.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-gray-500">Nenhuma aula agendada para esta semana</p>
        </div>
      )}
    </div>
  );
}

function getMonthName(month: number): string {
  const months = [
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
  return months[month];
}
