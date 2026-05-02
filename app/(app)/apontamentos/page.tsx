import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApontamentosAction } from "@/lib/apontamentos-actions";
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

export default async function ApontamentosPageWrapper() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getApontamentosAction();

  if (!result.success) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-red-600">{result.error}</p>
      </div>
    );
  }

  const apontamentos = (result.data?.apontamentos || []).map(serializeApontamento);
  const disciplinas = result.data?.disciplinas || [];
  const aulas = result.data?.aulas || [];
  const tarefas = (result.data?.tarefas || []).map((tarefa: any) => ({
    ...tarefa,
    prazo: tarefa.prazo ? new Date(tarefa.prazo).toISOString() : null,
  }));

  return (
    <ApontamentosView apontamentos={apontamentos} disciplinas={disciplinas} aulas={aulas} tarefas={tarefas} />
  );
}
