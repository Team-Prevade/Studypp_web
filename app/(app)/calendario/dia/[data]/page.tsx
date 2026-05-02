import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCalendarDayAction } from "@/lib/calendar-actions";
import { CalendarDayView } from "@/components/calendar-day-view";

const DATA_PARAM = /^(\d{4})-(\d{2})-(\d{2})$/;

export default async function CalendarioDiaPage({ params }: { params: { data: string } }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const raw = decodeURIComponent(params.data);
  if (!DATA_PARAM.test(raw)) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <p className="text-sm text-red-600">Data inválida na URL.</p>
        <Link href="/calendario" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
          Voltar ao calendário
        </Link>
      </div>
    );
  }

  const result = await getCalendarDayAction(raw);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <p className="text-sm text-red-600">{result.error ?? "Erro ao carregar o dia."}</p>
        <Link href="/calendario" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
          Voltar ao calendário
        </Link>
      </div>
    );
  }

  const { dataISO, disciplinas, eventos, avaliacoes, tarefas } = result.data;

  const eventosSerialized = eventos.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo,
    notas: e.notas,
    dataInicio: new Date(e.dataInicio).toISOString(),
    dataFim: e.dataFim ? new Date(e.dataFim).toISOString() : null,
    disciplina: e.disciplina
      ? {
          id: e.disciplina.id,
          nome: e.disciplina.nome,
          cor: e.disciplina.cor,
        }
      : null,
  }));

  const avaliacoesSerialized = avaliacoes.map((a) => ({
    id: a.id,
    tipo: a.tipo,
    data: new Date(a.data).toISOString(),
    disciplina: a.disciplina ? { nome: a.disciplina.nome } : undefined,
  }));

  const tarefasSerialized = tarefas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    prazo: new Date(t.prazo!).toISOString(),
    disciplina: t.disciplina
      ? {
          nome: t.disciplina.nome,
          cor: t.disciplina.cor,
        }
      : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <CalendarDayView
        isoDate={dataISO}
        disciplinas={disciplinas}
        eventos={eventosSerialized}
        avaliacoes={avaliacoesSerialized}
        tarefas={tarefasSerialized}
      />
    </div>
  );
}
