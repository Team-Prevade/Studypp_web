"use client";

import { useState } from "react";
import { BookOpen, TrendingUp, ChevronRight } from "lucide-react";

interface Avaliacao {
  id: string;
  nota: number;
  tipo: string;
}

interface MediaDisciplina {
  id: string;
  nome: string;
  cor?: string;
  media: number;
  totalNotas: number;
  avaliacoes: Avaliacao[];
}

interface GradesViewProps {
  mediaGlobal: number;
  totalAvaliacoes: number;
  mediasPorDisciplina: MediaDisciplina[];
  escalaAvaliacao: {
    excelente: number;
    suficiente: number;
    insuficiente: number;
  };
}

const getDisciplinaIcon = (nome: string) => {
  const icons: { [key: string]: string } = {
    "Matemática": "📐",
    "Física": "⚛️",
    "Química": "🧪",
    "Biologia": "🧬",
    "Filosofia": "📚",
    "História": "📜",
    "Português": "📖",
    "Inglês": "🌐",
    "Educação Física": "⚽",
    "Educação Visual": "🎨",
  };

  for (const [key, icon] of Object.entries(icons)) {
    if (nome.includes(key)) return icon;
  }
  return "📕";
};

export function GradesView({
  mediaGlobal,
  totalAvaliacoes,
  mediasPorDisciplina,
  escalaAvaliacao,
}: GradesViewProps) {
  const [expandedDisciplina, setExpandedDisciplina] = useState<string | null>(
    null
  );

  const getGradeColor = (media: number) => {
    if (media >= 14) return "text-green-600";
    if (media >= 10) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeScale = (nota: number) => {
    if (nota >= 14) return "Excelente";
    if (nota >= 10) return "Suficiente";
    return "Insuficiente";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Global Average Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800"></div>
            <div className="p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-4">
                Média global
              </h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">
                    {mediaGlobal}
                  </span>
                  <span className="text-gray-500 text-lg">/20</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Baseado em {totalAvaliacoes} avaliação
                {totalAvaliacoes !== 1 ? "ões" : ""}
              </p>

              {/* Grade scale */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="text-xs text-gray-600">
                    Excelente / Bom
                  </span>
                  <span className="ml-auto text-xs font-semibold text-gray-900">
                    ≥ 14 ({escalaAvaliacao.excelente})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                  <span className="text-xs text-gray-600">Suficiente</span>
                  <span className="ml-auto text-xs font-semibold text-gray-900">
                    10-13 ({escalaAvaliacao.suficiente})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span className="text-xs text-gray-600">Insuficiente</span>
                  <span className="ml-auto text-xs font-semibold text-gray-900">
                    &lt; 10 ({escalaAvaliacao.insuficiente})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disciplines by average */}
        <div className="lg:col-span-3">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Média por disciplina
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediasPorDisciplina.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma avaliação registada</p>
              </div>
            ) : (
              mediasPorDisciplina.map((disciplina) => (
                <div
                  key={disciplina.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                  onClick={() =>
                    setExpandedDisciplina(
                      expandedDisciplina === disciplina.id ? null : disciplina.id
                    )
                  }
                >
                  {/* Color bar */}
                  <div
                    className="h-1"
                    style={{
                      backgroundColor: disciplina.cor || "#1e3a8a",
                    }}
                  ></div>

                  <div className="p-4">
                    {/* Discipline header */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-2xl">
                        {getDisciplinaIcon(disciplina.nome)}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {disciplina.nome}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {disciplina.totalNotas} nota
                          {disciplina.totalNotas !== 1 ? "s registada" : " registada"}
                          {disciplina.totalNotas !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Average */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-1">Média atual</p>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-3xl font-bold ${getGradeColor(
                            disciplina.media
                          )}`}
                        >
                          {disciplina.media}
                        </span>
                        <span className="text-gray-500 text-sm">/20</span>
                      </div>
                      <p
                        className={`text-xs font-medium mt-1 ${getGradeColor(
                          disciplina.media
                        )}`}
                      >
                        {getGradeScale(disciplina.media)}
                      </p>
                    </div>

                    {/* View details link */}
                    <button className="w-full flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors py-2">
                      Ver detalhes
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Expanded view */}
                  {expandedDisciplina === disciplina.id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-600 mb-3">
                        Avaliações:
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {disciplina.avaliacoes.map((avaliacao) => (
                          <div
                            key={avaliacao.id}
                            className="flex items-center justify-between text-sm bg-white p-2 rounded"
                          >
                            <span className="text-gray-700">
                              {avaliacao.tipo}
                            </span>
                            <span
                              className={`font-semibold ${getGradeColor(
                                avaliacao.nota
                              )}`}
                            >
                              {avaliacao.nota}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
