"use client";

import { BookOpen } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  dark?: boolean;
}

export function Logo({
  size = "md",
  withText = true,
  dark = false,
}: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`rounded-lg p-1.5 ${
          dark
            ? "bg-white/20 backdrop-blur-sm"
            : "bg-gradient-to-br from-blue-600 to-blue-700"
        }`}
      >
        <BookOpen
          className={`${sizeClasses[size]} ${dark ? "text-white" : "text-white"}`}
          strokeWidth={2.5}
        />
      </div>
      {withText && (
        <span
          className={`${textClasses[size]} font-bold ${dark ? "text-white" : "text-gray-900"}`}
        >
          Study
          <span className={dark ? "text-white/80" : "text-blue-600"}>++</span>
        </span>
      )}
    </div>
  );
}
