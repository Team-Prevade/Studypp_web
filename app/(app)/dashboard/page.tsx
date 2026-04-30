import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Bem-vindo, {session.user?.name}!
              </h1>
              <p className="text-gray-600 mb-2">Email: {session.user?.email}</p>
              <p className="text-gray-600">
                Está dentro da sua área autenticada.
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
