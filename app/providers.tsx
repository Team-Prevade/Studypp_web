"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { NotificationBridge } from "@/components/notification-bridge";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <NotificationBridge />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "border border-gray-200 bg-white text-gray-900",
            title: "text-sm font-semibold",
            description: "text-sm text-gray-600",
            actionButton: "rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white",
            cancelButton: "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700",
          },
        }}
      />
    </SessionProvider>
  );
}
