"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { completeOnboardingAction } from "@/lib/onboarding-actions";

const CONFETTI_PIECES = [
  { left: "12%", top: "28%", color: "#3B82F6", x: -36, y: -48, rotate: 18 },
  { left: "18%", top: "42%", color: "#8B5CF6", x: -28, y: -68, rotate: -24 },
  { left: "24%", top: "32%", color: "#FBBF24", x: -16, y: -56, rotate: 32 },
  { left: "32%", top: "24%", color: "#16A34A", x: -12, y: -44, rotate: -18 },
  { left: "40%", top: "36%", color: "#EF4444", x: -8, y: -72, rotate: 26 },
  { left: "48%", top: "26%", color: "#185FA5", x: 0, y: -60, rotate: -30 },
  { left: "56%", top: "34%", color: "#8B5CF6", x: 10, y: -70, rotate: 22 },
  { left: "64%", top: "24%", color: "#16A34A", x: 16, y: -46, rotate: -20 },
  { left: "72%", top: "38%", color: "#FBBF24", x: 24, y: -64, rotate: 34 },
  { left: "80%", top: "30%", color: "#3B82F6", x: 32, y: -52, rotate: -28 },
  { left: "86%", top: "44%", color: "#EF4444", x: 38, y: -68, rotate: 16 },
  { left: "50%", top: "18%", color: "#185FA5", x: 4, y: -82, rotate: 40 },
];

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {CONFETTI_PIECES.map((piece, index) => (
        <span
          key={`${piece.left}-${index}`}
          className="confetti-piece"
          style={
            {
              left: piece.left,
              top: piece.top,
              backgroundColor: piece.color,
              "--confetti-x": `${piece.x}px`,
              "--confetti-y": `${piece.y}px`,
              "--confetti-rotate": `${piece.rotate}deg`,
              animationDelay: `${index * 12}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default function ConclusaoStep() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    setError("");
    setShowConfetti(false);

    try {
      const result = await completeOnboardingAction();

      if (!result.success) {
        setError(result.error || "Erro ao completar onboarding");
        setLoading(false);
        return;
      }

      setShowConfetti(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 420);
    } catch (err) {
      console.error("Error:", err);
      setError("Erro ao processar pedido");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center py-12">
      <ConfettiBurst active={showConfetti} />

      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Tudo pronto! Vamos começar
        </h1>

        <p className="mb-8 text-gray-600">
          A tua agenda está configurada e pronta para te ajudar a brilhar este
          ano.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleComplete}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Ir para dashboard...</span>
            </>
          ) : (
            <>
              <span>Ir para o meu dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <div className="mt-12 rounded-lg border border-blue-100 bg-blue-50 p-6">
          <p className="text-sm text-gray-600">
            <strong className="text-blue-700">Dica:</strong> Pode alterar todas
            estas configurações no seu perfil a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
