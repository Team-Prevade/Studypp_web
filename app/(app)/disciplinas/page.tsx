import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDisciplinesAction } from "@/lib/disciplines-actions";
import { DisciplinesList } from "@/components/disciplines-list";

export default async function DisciplinasPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getDisciplinesAction();

  const disciplinas = result.data?.disciplinas || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Disciplinas</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas disciplinas e visualize os relatórios
        </p>
      </div>

      <DisciplinesList disciplinas={disciplinas} />
    </div>
  );
}
