"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { completeOnboardingAction } from "@/lib/onboarding-actions";

export default function ConclusaoStep() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await completeOnboardingAction();

      if (!result.success) {
        setError(result.error || "Erro ao completar onboarding");
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Error:", err);
      setError("Erro ao processar pedido");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="text-center max-w-md">
        {/* Success Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-blue-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tudo pronto! Vamos começar</h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          A tua agenda está configurada e pronta para te ajudar a brilhar este ano.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Ir para Dashboard...</span>
            </>
          ) : (
            <>
              <span>Ir para o meu Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Footer message */}
        <div className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <p className="text-sm text-gray-600">
            <strong className="text-blue-700">Dica:</strong> Pode alterar todas estas configurações
            no seu perfil a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
