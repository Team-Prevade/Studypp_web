import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTasksAction } from "@/lib/tasks-actions";
import { TaskList } from "@/components/task-list";

export default async function TarefasPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getTasksAction();

  const tarefas = result.data?.tarefas || [];
  const disciplinas = result.data?.disciplinas || [];
  const pendentes = result.data?.pendentes || 0;
  const completas = result.data?.completas || 0;

  const tarefasFormatadas = tarefas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao ?? null,
    prazo: t.prazo ? new Date(t.prazo).toISOString() : null,
    status: t.status,
    prioridade: t.prioridade,
    progresso: t.progresso ?? 0,
    disciplina: t.disciplina || null,
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
  }));

  return (
    <TaskList
      tarefas={tarefasFormatadas}
      disciplinas={disciplinas}
      pendentes={pendentes}
      completas={completas}
    />
  );
}
