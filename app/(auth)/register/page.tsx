"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar para login</span>
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h1>
          <p className="text-gray-600 mb-8">
            Página de registo - em desenvolvimento
          </p>

          <div className="space-y-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
