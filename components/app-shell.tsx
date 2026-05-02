"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  if (isOnboarding) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="min-h-screen bg-gray-50 lg:ml-56">{children}</main>
    </div>
  );
}
