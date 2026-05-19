import { notFound } from "next/navigation";
import { SharedApontamentoEditor } from "@/components/shared-apontamento-editor";
import { getSharedApontamentoByToken } from "@/lib/apontamentos-share";

export default async function SharedApontamentoPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams?: { guest?: string };
}) {
  const result = await getSharedApontamentoByToken(params.token, searchParams?.guest);

  if (!result.success) {
    notFound();
  }

  const { apontamento, permission, collaborationToken, collaborator } = result.data;

  return (
    <SharedApontamentoEditor
      token={params.token}
      noteId={apontamento.id}
      initialTitle={apontamento.titulo}
      initialContent={apontamento.conteudo || "<p></p>"}
      permission={permission}
      collaborationToken={collaborationToken}
      collaborator={collaborator}
      ownerName={apontamento.utilizador.nome}
    />
  );
}
