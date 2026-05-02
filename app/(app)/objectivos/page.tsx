import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getObjectivosAction } from "@/lib/objectivos-actions";
import { ObjectivosView } from "@/components/objectivos-view";

function serializeObjectivo(objectivo: any) {
  return {
    ...objectivo,
    descricao: objectivo.descricao ?? "",
    prazo: objectivo.prazo ? new Date(objectivo.prazo).toISOString() : null,
    concluidoEm: objectivo.concluidoEm ? new Date(objectivo.concluidoEm).toISOString() : null,
    createdAt: objectivo.createdAt ? new Date(objectivo.createdAt).toISOString() : undefined,
    updatedAt: objectivo.updatedAt ? new Date(objectivo.updatedAt).toISOString() : undefined,
    subTarefas: (objectivo.subTarefas ?? []).map((subtarefa: any) => ({
      ...subtarefa,
      concluidaEm: subtarefa.concluidaEm ? new Date(subtarefa.concluidaEm).toISOString() : null,
      createdAt: subtarefa.createdAt ? new Date(subtarefa.createdAt).toISOString() : undefined,
    })),
  };
}

export default async function ObjectivosPageWrapper() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getObjectivosAction();

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <p className="text-red-600">{result.error}</p>
      </div>
    );
  }

  const objectivos = (result.data?.objectivos || []).map(serializeObjectivo);
  const onTrackPercentage = result.data?.onTrackPercentage || 0;
  const activeCount = result.data?.activeCount || 0;
  const completedCount = result.data?.completedCount || 0;

  return (
    <ObjectivosView
      objectivos={objectivos}
      onTrackPercentage={onTrackPercentage}
      activeCount={activeCount}
      completedCount={completedCount}
    />
  );
}
