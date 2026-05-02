import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings-view";
import { getSettingsAction } from "@/lib/settings-actions";

export default async function DefinicoesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getSettingsAction();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="text-red-600">{result.error || "Erro ao carregar definições"}</p>
        </div>
      </div>
    );
  }

  return <SettingsView initialSettings={result.data} />;
}
