import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCalendarEventsAction } from "@/lib/calendar-actions";
import { CalendarView } from "@/components/calendar-view";

export default async function CalendarioPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const hoje = new Date();
  const result = await getCalendarEventsAction(hoje.getFullYear(), hoje.getMonth());

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <p className="text-red-600">Erro ao carregar calendário</p>
      </div>
    );
  }

  const { data } = result;

  // Convert dates to proper format
  const eventos = data.eventos.map((e: any) => ({
    ...e,
    data: new Date(e.data),
  }));

  const avaliacoes = data.avaliacoes.map((a: any) => ({
    ...a,
    data: new Date(a.data),
  }));

  const tarefas = data.tarefas.map((t: any) => ({
    ...t,
    prazo: new Date(t.prazo),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <CalendarView
        eventos={eventos}
        avaliacoes={avaliacoes}
        tarefas={tarefas}
        initialMonth={data.month}
        initialYear={data.year}
      />
    </div>
  );
}
