"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { registerAction } from "@/lib/auth-actions";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await registerAction(nome, email, password, confirmPassword);
      if (result && !result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError("Erro ao registar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden flex-col justify-between bg-blue-900 p-16 text-white lg:flex lg:w-1/2">
        <div className="mb-2">
          <Logo size="md" withText={true} dark={true} />
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <h1 className="mb-8 font-sans text-6xl font-bold leading-tight">
            Começa agora
            <br />a organizar
            <br />
            os teus estudos
          </h1>
          <p className="max-w-md text-lg font-light leading-relaxed text-blue-100">
            Junta-te aos estudantes que já transformaram a sua forma de estudar.
          </p>
        </div>

        <div className="flex items-center gap-4 border-t border-blue-400/30 pt-8">
          <div className="relative h-16 w-16 shrink-0">
            <div className="absolute inset-0 rounded-full bg-blue-700 shadow-sm"></div>
            <div className="absolute inset-1 flex items-center justify-center rounded-full bg-blue-600">
              <span className="text-lg font-bold text-white">JS</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-base font-light italic leading-relaxed text-blue-50">
              &ldquo;Finalmente consegui organizar-me!&rdquo;
            </p>
            <p className="mt-1 text-sm font-medium text-blue-300">
              João Silva, Aluno de Engenharia
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-8 lg:w-1/2 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex gap-8 border-b border-gray-200">
            <Link
              href="/login"
              className="pb-3 text-lg font-medium text-gray-500 transition-colors hover:text-gray-700"
            >
              Entrar
            </Link>
            <button
              type="button"
              aria-current="page"
              className="border-b-2 border-blue-600 pb-3 text-lg font-medium text-blue-600"
            >
              Criar conta
            </button>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              Criar conta
            </h2>
            <p className="text-gray-600">
              Preenche os dados para começares a organizar os teus estudos.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="nome" className="mb-2 block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                placeholder="João Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
                  aria-label={showPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                Confirmar palavra-passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma a palavra-passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
                  aria-label={showConfirmPassword ? "Esconder confirmação" : "Mostrar confirmação"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  A criar conta...
                </>
              ) : (
                <>Criar conta →</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
