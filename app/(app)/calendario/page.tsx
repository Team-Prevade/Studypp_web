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
    const disciplinas = result.data?.disciplinas || [];
    const month = result.data?.month ?? hoje.getMonth();
    const year = result.data?.year ?? hoje.getFullYear();

    const eventosFormatados = eventos.map((e: any) => ({
      id: e.id,
      dataInicio:
        typeof e.dataInicio === "string" ? new Date(e.dataInicio) : e.dataInicio,
      dataFim: e.dataFim
        ? typeof e.dataFim === "string"
          ? new Date(e.dataFim)
          : e.dataFim
        : null,
      titulo: e.titulo || "Evento sem título",
      tipo: e.tipo || "EVENTO_PESSOAL",
      notas: e.notas ?? null,
      disciplina: e.disciplina
        ? {
            id: e.disciplina.id,
            nome: e.disciplina.nome,
            cor: e.disciplina.cor,
          }
        : null,
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
      titulo: t.titulo || "Tarefa sem título",
      disciplina: t.disciplina
        ? {
            nome: t.disciplina.nome,
            cor: t.disciplina.cor,
          }
        : null,
    }));

    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <CalendarView
          eventos={eventosFormatados}
          avaliacoes={avaliacoesFormatadas}
          tarefas={tarefasFormatadas}
          disciplinas={disciplinas}
          initialMonth={month}
          initialYear={year}
        />
      </div>
    );
  } catch (error) {
    console.error("Calendar error:", error);
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <h1 className="text-xl font-semibold text-red-600">Erro ao carregar calendário</h1>
        <p className="mt-2 text-sm text-gray-600">
          Ocorreu um erro ao recuperar os dados. Tenta novamente mais tarde.
        </p>
      </div>
    );
  }
}
