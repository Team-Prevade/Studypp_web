import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study++ - Autenticação",
  description: "Faça login ou registre-se na Study++",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
