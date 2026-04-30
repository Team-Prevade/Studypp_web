import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bem-vindo, {session.user?.name}! 👋
            </h1>
            <p className="text-xl text-gray-600">
              Vamos preparar a sua conta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 - Informações Pessoais */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="text-3xl mb-2">📚</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Informações da Escola
              </h2>
              <p className="text-gray-600 mb-4">
                Configure o seu ano escolar e disciplinas
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">
                Começar
              </button>
            </div>

            {/* Card 2 - Horário */}
            <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
              <div className="text-3xl mb-2">📅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Seu Horário
              </h2>
              <p className="text-gray-600 mb-4">
                Adicione suas aulas e eventos importantes
              </p>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors">
                Começar
              </button>
            </div>

            {/* Card 3 - Preferências */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="text-3xl mb-2">⚙️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Preferências
              </h2>
              <p className="text-gray-600 mb-4">
                Personalize a sua experiência
              </p>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors">
                Começar
              </button>
            </div>

            {/* Card 4 - Pronto */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="text-3xl mb-2">✨</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Pronto para Começar?
              </h2>
              <p className="text-gray-600 mb-4">
                Vá para o seu dashboard
              </p>
              <a
                href="/dashboard"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors text-center"
              >
                Ir para Dashboard
              </a>
            </div>
          </div>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700">
              <strong>Email registado:</strong> {session.user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
