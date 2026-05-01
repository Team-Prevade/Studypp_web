import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getNotificacoesAction } from "@/lib/notificacoes-actions";
import { NotificacoesView } from "@/components/notificacoes-view";

export default async function NotificacoesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getNotificacoesAction();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <p className="text-red-600">
            {result.error || "Erro ao carregar notificações"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <NotificacoesView
      notificacoes={result.data.notificacoes}
      unreadCount={result.data.unreadCount}
    />
  );
}
