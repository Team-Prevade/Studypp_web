import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStatisticsAction } from "@/lib/estatisticas-actions";
import { StatisticsView } from "@/components/statistics-view";

export default async function EstatisticasPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getStatisticsAction("MES");

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <p className="text-red-600">
            {result.error || "Erro ao carregar estatísticas"}
          </p>
        </div>
      </div>
    );
  }

  return <StatisticsView data={result.data} />;
}
