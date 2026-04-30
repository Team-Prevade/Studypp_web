"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen flex bg-white">
      {/* Coluna Esquerda - Azul */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#1e3a8a] via-[#1e3a8a] to-[#254aa8] text-white flex-col justify-between p-16">
        <div className="mb-2">
          <Logo size="md" withText={true} dark={true} />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-6xl font-bold leading-tight mb-8 font-sans">
            Começa agora<br />a organizar<br />os teus estudos
          </h1>
          <p className="text-lg leading-relaxed text-blue-100 font-light max-w-md">
            Junte-se a milhares de estudantes que já transformaram a sua forma de estudar.
          </p>
        </div>

        <div className="flex items-center gap-4 pt-8 border-t border-blue-400 border-opacity-30">
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500 rounded-full shadow-lg"></div>
            <div className="absolute inset-1 bg-gradient-to-br from-blue-300 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-white">JS</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-blue-50 italic text-base font-light leading-relaxed">
              "Finalmente consegui organizar-me!"
            </p>
            <p className="text-blue-300 text-sm font-medium mt-1">
              João Silva, Aluno de Engenharia
            </p>
          </div>
        </div>
      </div>

      {/* Coluna Direita - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 sm:px-8 lg:px-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Link para login */}
          <Link href="/login" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar para login</span>
          </Link>

          {/* Títulos */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Criar conta
            </h2>
            <p className="text-gray-600">
              Preencha os dados para se registar.
            </p>
          </div>

          {/* Erro Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
                className="w-full px-4 py-3 rounded-lg bg-blue-50 border border-blue-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
                className="w-full px-4 py-3 rounded-lg bg-blue-50 border border-blue-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Palavra-passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
                  className="w-full px-4 py-3 rounded-lg bg-blue-50 border border-blue-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Palavra-passe */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmar palavra-passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme a palavra-passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg bg-blue-50 border border-blue-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão Registar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registando...
                </>
              ) : (
                <>
                  Criar conta
                  <span>→</span>
                </>
              )}
            </button>

            {/* Já tem conta */}
            <p className="text-center text-gray-600 text-sm mt-6">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Faça login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
