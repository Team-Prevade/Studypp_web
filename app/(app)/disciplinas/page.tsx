import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDisciplinesAction } from "@/lib/disciplines-actions";
import { DisciplinesPage } from "@/components/disciplines-page";

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

export default async function DisciplinasPageWrapper() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getDisciplinesAction();

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-red-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const disciplinas = (result.data?.disciplinas || []).map(serializeDisciplina);

  return <DisciplinesPage disciplinas={disciplinas} />;
}
