import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getGradesAction } from "@/lib/grades-actions";
import { GradesView } from "@/components/grades-view";

export default async function NotasPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getGradesAction();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Erro ao carregar notas
          </h1>
          <p className="text-gray-600">
            Não foi possível carregar os dados de notas.
          </p>
        </div>
      </div>
    );
  }

  const avaliacoes = result.data.avaliacoes.map((avaliacao) => ({
    id: avaliacao.id,
    disciplinaId: avaliacao.disciplinaId,
    nome: avaliacao.nome,
    tipo: avaliacao.tipo,
    data: new Date(avaliacao.data).toISOString(),
    nota: avaliacao.nota,
    peso: avaliacao.peso,
    observacoes: avaliacao.observacoes,
    disciplina: avaliacao.disciplina,
    createdAt: new Date(avaliacao.createdAt).toISOString(),
  }));

  return (
    <GradesView
      avaliacoes={avaliacoes}
      disciplinas={result.data.disciplinas}
    />
  );
}
