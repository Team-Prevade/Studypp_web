import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTemporizadorAction } from "@/lib/temporizador-actions";
import { TemporizadorView } from "@/components/temporizador-view";

function serializeData(data: any) {
  return {
    ...data,
    sessoesHoje: (data.sessoesHoje ?? []).map((sessao: any) => ({
      ...sessao,
      iniciadaEm: new Date(sessao.iniciadaEm).toISOString(),
      terminadaEm: sessao.terminadaEm ? new Date(sessao.terminadaEm).toISOString() : null,
    })),
  };
}

export default async function TemporizadorPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getTemporizadorAction();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <p className="text-red-600">
            {result.error || "Erro ao carregar temporizador"}
          </p>
        </div>
      </div>
    );
  }

  return <TemporizadorView data={serializeData(result.data)} />;
}
