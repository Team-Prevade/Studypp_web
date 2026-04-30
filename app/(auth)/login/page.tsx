"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implementar lógica de login
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Coluna Esquerda - Azul */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#1e3a8a] via-[#1e3a8a] to-[#254aa8] text-white flex-col justify-between p-16">
        {/* Logo */}
        <div className="mb-2">
          <Logo size="md" withText={true} dark={true} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-6xl font-bold leading-tight mb-8 font-sans">
            A tua escola<br />organizada,<br />ao teu ritmo
          </h1>
          <p className="text-lg leading-relaxed text-blue-100 font-light max-w-md">
            Planifica os teus estudos, acompanha os prazos e liberta a tua mente para o que realmente importa: aprender.
          </p>
        </div>

        {/* Testimonial */}
        <div className="flex items-center gap-4 pt-8 border-t border-blue-400 border-opacity-30">
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-pink-400 to-purple-600 rounded-full shadow-lg"></div>
            <div className="absolute inset-1 bg-gradient-to-br from-amber-300 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-white">MJ</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-blue-50 italic text-base font-light leading-relaxed">
              "A melhor ferramenta para o meu semestre"
            </p>
            <p className="text-blue-300 text-sm font-medium mt-1">
              Maria João, Estudante de Design
            </p>
          </div>
        </div>
      </div>

      {/* Coluna Direita - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex gap-8 mb-10 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("login")}
              className={`pb-3 text-lg font-medium transition-colors ${
                activeTab === "login"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Entrar
            </button>
            <Link href="/register">
              <button
                className={`pb-3 text-lg font-medium transition-colors ${
                  activeTab === "register"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Criar conta
              </button>
            </Link>
          </div>

          {/* Títulos */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-gray-600">
              Introduza as suas credenciais para aceder.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                required
                className="w-full px-4 py-3 rounded-lg bg-blue-50 border border-blue-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
              />
            </div>

            {/* Palavra-passe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Palavra-passe
                </label>
                <Link href="/forgot-password">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Esqueceu a palavra-passe?
                  </button>
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-blue-50 border border-blue-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-blue-50 border border-blue-200 rounded focus:ring-2 focus:ring-blue-600 cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="ml-2 text-sm text-gray-700 cursor-pointer"
              >
                Lembrar neste dispositivo
              </label>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? "Entrando..." : "Entrar na conta"}
              <span>→</span>
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500 font-medium">
              OU CONTINUA COM
            </span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </div>
      </div>
    </div>
  );
}
