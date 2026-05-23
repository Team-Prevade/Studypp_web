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
      <button className="flex items-center gap-3 rounded-xl px-4 py-2 transition-colors hover:bg-gray-100">
        <div className="flex flex-col text-right">
          <p className="text-sm font-medium text-gray-900">{nome}</p>
          {email && <p className="text-xs text-gray-500">{email}</p>}
        </div>
        <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-full shadow-[0_10px_24px_rgba(36,107,255,0.22)]">
          <User className="w-5 h-5 text-white" />
        </div>
      </button>
    </Link>
  );
}
