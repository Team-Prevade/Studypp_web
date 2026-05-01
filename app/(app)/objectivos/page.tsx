import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getObjectivosAction } from "@/lib/objectivos-actions";
import { ObjectivosView } from "@/components/objectivos-view";

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

  const objectivos = result.data?.objectivos || [];
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
