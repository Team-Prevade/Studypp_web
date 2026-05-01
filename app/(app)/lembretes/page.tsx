import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLembretesAction } from "@/lib/lembretes-actions";
import { LembretesView } from "@/components/lembretes-view";

export default async function LembretesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getLembretesAction();

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <p className="text-red-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const lembretes = result.data?.lembretes || [];
  const disciplinas = result.data?.disciplinas || [];
  const grupos = result.data?.grupos || {
    atrasados: [],
    hoje: [],
    amanha: [],
    futuros: [],
  };

  return (
    <LembretesView
      lembretes={lembretes}
      disciplinas={disciplinas}
      grupos={grupos}
    />
  );
}
