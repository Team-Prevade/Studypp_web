import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study++ - Dashboard",
  description: "Sua área de estudo personalizada",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
