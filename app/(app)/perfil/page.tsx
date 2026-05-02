import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfileAction } from "@/lib/profile-actions";
import { ProfileView } from "@/components/profile-view";

export default async function PerfilPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const result = await getProfileAction();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erro ao carregar perfil
          </h1>
          <p className="text-gray-600">
            Não foi possível carregar seus dados de perfil.
          </p>
        </div>
      </div>
    );
  }

  return <ProfileView user={result.data} />;
}
