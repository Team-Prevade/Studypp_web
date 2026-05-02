import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLembretesAction } from "@/lib/lembretes-actions";
import { LembretesView } from "@/components/lembretes-view";

function serializeLembrete(lembrete: any) {
  return {
    ...lembrete,
    dataHora: new Date(lembrete.dataHora).toISOString(),
    concluidoEm: lembrete.concluidoEm ? new Date(lembrete.concluidoEm).toISOString() : null,
    createdAt: lembrete.createdAt ? new Date(lembrete.createdAt).toISOString() : undefined,
    updatedAt: lembrete.updatedAt ? new Date(lembrete.updatedAt).toISOString() : undefined,
    disciplina: lembrete.disciplina ?? null,
  };
}

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

  const lembretes = (result.data?.lembretes || []).map(serializeLembrete);
  const disciplinas = result.data?.disciplinas || [];
  const grupos = result.data?.grupos || {
    atrasados: [],
    hoje: [],
    amanha: [],
    futuros: [],
  };
  const serializedGroups = {
    atrasados: (grupos.atrasados || []).map(serializeLembrete),
    hoje: (grupos.hoje || []).map(serializeLembrete),
    amanha: (grupos.amanha || []).map(serializeLembrete),
    futuros: (grupos.futuros || []).map(serializeLembrete),
  };

  return (
    <LembretesView
      lembretes={lembretes}
      disciplinas={disciplinas}
      grupos={serializedGroups}
    />
  );
}
