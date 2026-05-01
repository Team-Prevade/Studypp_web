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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erro ao carregar notas
          </h1>
          <p className="text-gray-600">
            Não foi possível carregar seus dados de notas.
          </p>
        </div>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Registo de notas</h1>
        <p className="text-gray-600 mt-2">Acompanha a teu progresso académico e médias</p>
      </div>

      <GradesView
        mediaGlobal={data.mediaGlobal}
        totalAvaliacoes={data.totalAvaliacoes}
        mediasPorDisciplina={data.mediasPorDisciplina}
        escalaAvaliacao={data.escalaAvaliacao}
      />
    </div>
  );
}
    </div>
  );
}
