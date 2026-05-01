import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTimetableAction } from "@/lib/timetable-actions";
import { TimetableView } from "@/components/timetable-view";
import { getDisciplinesAction } from "@/lib/disciplines-actions";

export default async function HorarioPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getTimetableAction(new Date());
  const disciplinesResult = await getDisciplinesAction();

  if (
    !result.success ||
    !result.data ||
    !disciplinesResult.success ||
    !disciplinesResult.data
  ) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <p className="text-red-600">Erro ao carregar horário</p>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <TimetableView
        initialStartDate={data.startDate}
        initialAulas={data.aulas}
        horas={data.horas}
        disciplinas={disciplinesResult.data.disciplinas}
      />
    </div>
  );
}
