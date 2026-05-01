import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getNotesAction } from "@/lib/notes-actions";
import { NotesList } from "@/components/notes-list";

export default async function NotasPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getNotesAction();

  const notas = result.data?.notas || [];
  const disciplinas = result.data?.disciplinas || [];
  const notasPorDisciplina = result.data?.notasPorDisciplina || {};

  // Convert dates to proper format
  const notasFormatadas = notas.map((n: any) => ({
    id: n.id,
    titulo: n.titulo,
    conteudo: n.conteudo,
    disciplinaId: n.disciplinaId,
    updatedAt:
      typeof n.updatedAt === "string" ? new Date(n.updatedAt) : n.updatedAt,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Notas</h1>
        <p className="text-gray-600 mt-2">Organize suas notas por disciplina</p>
      </div>

      <NotesList
        notas={notasFormatadas}
        disciplinas={disciplinas}
        notasPorDisciplina={notasPorDisciplina}
      />
    </div>
  );
}
