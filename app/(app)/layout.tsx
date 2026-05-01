import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Study++ - Dashboard",
  description: "Sua área de estudo personalizada",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-56">{children}</main>
    </div>
  );
}
