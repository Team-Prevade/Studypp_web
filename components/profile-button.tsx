"use client";

import Link from "next/link";
import { User } from "lucide-react";

interface ProfileButtonProps {
  nome?: string;
  email?: string;
}

export function ProfileButton({
  nome = "Utilizador",
  email,
}: ProfileButtonProps) {
  return (
    <Link href="/perfil">
      <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex flex-col text-right">
          <p className="text-sm font-medium text-gray-900">{nome}</p>
          {email && <p className="text-xs text-gray-500">{email}</p>}
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      </button>
    </Link>
  );
}
