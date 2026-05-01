import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardDataAction } from "@/lib/dashboard-actions";
import {
  formatarDataPT,
  formatarHora,
  formatarMinutos,
  formatarTempoRelativo,
  pluralizar,
} from "@/lib/date-utils";
import { CheckCircle2, Calendar, Clock, TrendingUp, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getDashboardDataAction();

  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  const { data } = result;
  const hoje = new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Bom dia, {data.user.nome}!
          </h1>
          <p className="text-gray-600">{formatarDataPT(hoje)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Tarefas para hoje */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Tarefas para hoje
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.totalTarefasHoje}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          {/* Próximo teste */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Próximo teste
                </p>
                {data.proximoTeste ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatarTempoRelativo(data.proximoTeste.data)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {data.proximoTeste.disciplina?.nome}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">-</p>
                )}
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          {/* Horas de estudo */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Horas de estudo
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatarMinutos(data.totalMinutosEstudo)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Esta semana</p>
              </div>
              <Clock className="w-8 h-8 text-teal-500" />
            </div>
          </div>

          {/* Média geral */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Média geral
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.mediaGeral > 0 ? data.mediaGeral.toFixed(1) : "-"}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Horário de hoje */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Horário de hoje
            </h2>

            {data.aulasHoje.length > 0 ? (
              <div className="space-y-3">
                {data.aulasHoje.map((aula) => (
                  <div
                    key={aula.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{
                        backgroundColor: aula.disciplina?.cor || "#185FA5",
                      }}
                    ></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {aula.disciplina?.nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatarHora(aula.horaInicio)} -{" "}
                        {formatarHora(aula.horaFim)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sem aulas agendadas para hoje</p>
              </div>
            )}
          </div>

          {/* Próximos prazos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Próximos prazos
            </h2>

            {data.tarefasPendentes.length > 0 ? (
              <div className="space-y-3">
                {data.tarefasPendentes.map((tarefa) => (
                  <div key={tarefa.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-start gap-2 mb-2">
                      {tarefa.status === "ATRASADA" ? (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {tarefa.descricao}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {tarefa.disciplina?.nome}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        tarefa.status === "ATRASADA"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {formatarTempoRelativo(tarefa.prazo)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma tarefa pendente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
