"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, User, BookMarked, Clock, Loader2 } from "lucide-react";
import { completeOnboardingAction } from "@/lib/onboarding-actions";
import { Logo } from "@/components/shared/logo";

const steps = [
  { id: 1, slug: "perfil", label: "Perfil", icon: User },
  { id: 2, slug: "disciplinas", label: "Disciplinas", icon: BookMarked },
  { id: 3, slug: "horario", label: "Horário", icon: Clock },
  { id: 4, slug: "conclusao", label: "Conclusão", icon: CheckCircle2 },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSkipping, setIsSkipping] = useState(false);
  const currentStep = steps.find((s) => pathname.includes(s.slug));
  const currentStepNumber = currentStep?.id || 1;

  const handleSkip = async () => {
    setIsSkipping(true);
    const result = await completeOnboardingAction();

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setIsSkipping(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="relative w-72 bg-white border-r border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="mb-8">
              <Logo size="md" withText={true} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Passo {currentStepNumber} de 4
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="brand-button h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStepNumber / 4) * 100}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSkipping}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#dce7ff] bg-[#eef4ff] px-4 py-2 text-sm font-semibold text-[#246bff] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSkipping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A saltar...
                </>
              ) : (
                "Pular configuração"
              )}
            </button>
          </div>

          {/* Steps Navigation */}
          <nav className="p-6 space-y-4">
            {steps.map((step) => {
              const isActive = currentStepNumber === step.id;
              const isCompleted = currentStepNumber > step.id;
              const Icon = step.icon;

              return (
                <Link
                  key={step.id}
                  href={`/onboarding/${step.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#eef4ff] border border-[#dce7ff] text-[#246bff]"
                      : isCompleted
                        ? "text-green-700 hover:bg-green-50"
                        : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <Icon className="w-5 h-5 shrink-0" />
                  )}
                  <span className="font-medium text-sm">{step.label}</span>
                  {!isCompleted && !isActive && (
                    <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      {step.id}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="rounded-lg border border-[#dce7ff] bg-[#eef4ff] p-4">
              <p className="text-xs font-medium text-[#246bff]">
                Dica: Pode voltar para alterar qualquer informação depois.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-12">{children}</div>
        </div>
      </div>
    </div>
  );
}
