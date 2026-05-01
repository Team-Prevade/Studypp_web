import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCalendarEventsAction } from "@/lib/calendar-actions";
import { CalendarView } from "@/components/calendar-view";

export default async function CalendarioPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  try {
    const hoje = new Date();
    const result = await getCalendarEventsAction(
      hoje.getFullYear(),
      hoje.getMonth(),
    );

    const eventos = result.data?.eventos || [];
    const avaliacoes = result.data?.avaliacoes || [];
    const tarefas = result.data?.tarefas || [];
    const month = result.data?.month ?? hoje.getMonth();
    const year = result.data?.year ?? hoje.getFullYear();

    // Convert dates to proper format
    const eventosFormatados = eventos.map((e: any) => ({
      id: e.id,
      data: typeof e.data === "string" ? new Date(e.data) : e.data,
      titulo: e.titulo || "Evento sem título",
      tipo: e.tipo || "EVENTO",
    }));

    const avaliacoesFormatadas = avaliacoes.map((a: any) => ({
      id: a.id,
      data: typeof a.data === "string" ? new Date(a.data) : a.data,
      tipo: a.tipo || "PROVA",
      disciplina: a.disciplina || { nome: "Disciplina" },
    }));

    const tarefasFormatadas = tarefas.map((t: any) => ({
      id: t.id,
      prazo: typeof t.prazo === "string" ? new Date(t.prazo) : t.prazo,
      descricao: t.descricao || "Tarefa sem descrição",
    }));

    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <CalendarView
          eventos={eventosFormatados}
          avaliacoes={avaliacoesFormatadas}
          tarefas={tarefasFormatadas}
          initialMonth={month}
          initialYear={year}
        />
      </div>
    );
  } catch (error) {
    console.error("Calendar error:", error);
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erro ao carregar calendário
          </h1>
          <p className="text-gray-600">
            Ocorreu um erro ao recuperar os dados. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }
}
