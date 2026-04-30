import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study++",
  description: "A tua escola organizada, ao teu ritmo",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
