import { auth } from "@/auth";
import { DisciplineDetailPage } from "@/components/discipline-detail-page";
import { getDisciplineAction } from "@/lib/disciplines-actions";
import { redirect } from "next/navigation";

function serializeDisciplina(disciplina: any) {
  return {
    ...disciplina,
    createdAt: disciplina.createdAt ? new Date(disciplina.createdAt).toISOString() : undefined,
    updatedAt: disciplina.updatedAt ? new Date(disciplina.updatedAt).toISOString() : undefined,
    tarefas: (disciplina.tarefas ?? []).map((tarefa: any) => ({
      ...tarefa,
      prazo: tarefa.prazo ? new Date(tarefa.prazo).toISOString() : null,
    })),
    avaliacoes: (disciplina.avaliacoes ?? []).map((avaliacao: any) => ({
      ...avaliacao,
      data: new Date(avaliacao.data).toISOString(),
    })),
    apontamentos: (disciplina.apontamentos ?? []).map((apontamento: any) => ({
      ...apontamento,
      updatedAt: new Date(apontamento.updatedAt).toISOString(),
    })),
    sessoesEstudo: (disciplina.sessoesEstudo ?? []).map((sessao: any) => ({
      ...sessao,
      iniciadaEm: new Date(sessao.iniciadaEm).toISOString(),
      terminadaEm: sessao.terminadaEm ? new Date(sessao.terminadaEm).toISOString() : null,
    })),
    eventos: (disciplina.eventos ?? []).map((evento: any) => ({
      ...evento,
      dataInicio: new Date(evento.dataInicio).toISOString(),
      dataFim: evento.dataFim ? new Date(evento.dataFim).toISOString() : null,
    })),
  };
}

export default async function DisciplinaDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getDisciplineAction(params.id);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-red-600">{result.error || "Disciplina não encontrada"}</p>
        </div>
      </div>
    );
  }

  return <DisciplineDetailPage disciplina={serializeDisciplina(result.data)} />;
}
