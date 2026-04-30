"use client";

import { logoutAction } from "@/lib/auth-actions";

export function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
    >
      Logout
    </button>
  );
}
