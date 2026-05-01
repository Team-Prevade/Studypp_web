import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDisciplinesAction } from "@/lib/disciplines-actions";
import { DisciplinesPage } from "@/components/disciplines-page";

export default async function DisciplinasPageWrapper() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getDisciplinesAction();

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-red-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const disciplinas = result.data?.disciplinas || [];

  return <DisciplinesPage disciplinas={disciplinas} />;
}
