import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardDataAction } from "@/lib/dashboard-actions";
import { ProfileButton } from "@/components/profile-button";
import {
  formatarDataPT,
  formatarHora,
  formatarMinutos,
  formatarTempoRelativo,
  pluralizar,
} from "@/lib/date-utils";
import {
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Bell,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getDashboardDataAction();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6 text-center">
        <p className="text-red-600">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  const { data } = result;
  const hoje = new Date();
  const aulasHoje = data.aulasHoje as unknown as Array<{
    id: string;
    horaInicio: string;
    horaFim: string;
    disciplina: { nome: string; cor: string } | null;
  }>;
  const tarefasPendentes = data.tarefasPendentes as unknown as Array<{
    id: string;
    descricao: string;
    prazo: Date | null;
    status: string;
    disciplina: { nome: string } | null;
  }>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Bom dia, {data.user.nome}!
            </h1>
            <p className="text-gray-600">{formatarDataPT(hoje)}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/notificacoes"
              className="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Link>
            <ProfileButton nome={data.user.nome} email={data.user.email} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Tarefas para hoje */}
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-6">
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
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-purple-500 bg-white p-6">
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
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-teal-500 bg-white p-6">
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
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-orange-500 bg-white p-6">
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
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Horário de hoje
            </h2>

            {aulasHoje.length > 0 ? (
              <div className="space-y-3">
                {aulasHoje.map((aula) => (
                  <div
                    key={aula.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div
                      className="h-12 w-1 rounded-full"
                      style={{
                        backgroundColor: aula.disciplina?.cor || "#185FA5",
                      }}
                    ></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {aula.disciplina?.nome || "Disciplina"}
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
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Próximos prazos
            </h2>

            {tarefasPendentes.length > 0 ? (
              <div className="space-y-3">
                {tarefasPendentes.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {tarefa.status === "ATRASADA" ? (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
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
                      {tarefa.prazo ? formatarTempoRelativo(tarefa.prazo) : "-"}
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
