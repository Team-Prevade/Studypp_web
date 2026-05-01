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
  const pendentes = result.data?.pendentes || 0;
  const completas = result.data?.completas || 0;

  // Convert dates to proper format
  const tarefasFormatadas = tarefas.map((t: any) => ({
    id: t.id,
    descricao: t.descricao,
    prazo: typeof t.prazo === "string" ? new Date(t.prazo) : t.prazo,
    status: t.status,
    prioridade: t.prioridade || "BAIXA",
    disciplina: t.disciplina || null,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Tarefas</h1>
        <p className="text-gray-600 mt-2">
          Gerencie todas as suas tarefas acadêmicas
        </p>
      </div>

      <TaskList
        tarefas={tarefasFormatadas}
        pendentes={pendentes}
        completas={completas}
      />
    </div>
  );
}
