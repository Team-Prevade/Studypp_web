import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTimetableAction } from "@/lib/timetable-actions";
import { TimetableView } from "@/components/timetable-view";
import { getInicioDaSemana } from "@/lib/date-utils";

export default async function HorarioPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getTimetableAction(new Date());

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <p className="text-red-600">Erro ao carregar horário</p>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <TimetableView
        initialStartDate={data.startDate}
        initialAulas={data.aulas}
        horas={data.horas}
      />
    </div>
  );
}
