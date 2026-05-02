import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApontamentosAction, getApontamentoByIdAction } from "@/lib/apontamentos-actions";
import { ApontamentosView } from "@/components/apontamentos-view";

function serializeApontamento(apontamento: any) {
  return {
    ...apontamento,
    conteudo: apontamento.conteudo ?? "",
    tipo: apontamento.tipo ?? "LIVRE",
    createdAt: new Date(apontamento.createdAt).toISOString(),
    updatedAt: new Date(apontamento.updatedAt).toISOString(),
    disciplina: apontamento.disciplina ?? null,
    parent: apontamento.parent ?? null,
    subNotas: (apontamento.subNotas || []).map((item: any) => ({
      ...item,
      updatedAt: new Date(item.updatedAt).toISOString(),
    })),
    aula: apontamento.aula ?? null,
    tarefa: apontamento.tarefa
      ? {
          ...apontamento.tarefa,
          prazo: apontamento.tarefa.prazo ? new Date(apontamento.tarefa.prazo).toISOString() : null,
        }
      : null,
  };
}

export default async function ApontamentoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const [detailResult, listResult] = await Promise.all([
    getApontamentoByIdAction(params.id),
    getApontamentosAction(),
  ]);

  if (!detailResult.success || !detailResult.data) {
    redirect("/apontamentos");
  }

  if (!listResult.success) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-red-600">{listResult.error}</p>
      </div>
    );
  }

  const apontamentos = (listResult.data?.apontamentos || []).map(serializeApontamento);
  const disciplinas = listResult.data?.disciplinas || [];
  const aulas = listResult.data?.aulas || [];
  const tarefas = (listResult.data?.tarefas || []).map((tarefa: any) => ({
    ...tarefa,
    prazo: tarefa.prazo ? new Date(tarefa.prazo).toISOString() : null,
  }));

  return (
    <ApontamentosView
      apontamentos={apontamentos}
      disciplinas={disciplinas}
      aulas={aulas}
      tarefas={tarefas}
      initialSelectedId={params.id}
    />
  );
}
