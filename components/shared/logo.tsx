"use client";

import Image from "next/image";

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
  const iconClasses = {
    sm: "h-9 w-8",
    md: "h-12 w-10",
    lg: "h-16 w-14",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex items-center gap-3">
      <span
        className={`${iconClasses[size]} relative block shrink-0`}
      >
        <Image
          src="/brand/logo-mark.svg"
          alt="Study++"
          fill
          priority={size !== "sm"}
          sizes={size === "lg" ? "56px" : size === "md" ? "40px" : "32px"}
          className="object-contain"
        />
      </span>

      {withText && (
        <span
          className={`${textClasses[size]} font-black tracking-tight ${dark ? "text-white" : "text-gray-950"}`}
        >
          Study
          <span
            className={
              dark
                ? "bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent"
                : "bg-gradient-to-r from-[#7c2cff] via-[#246bff] to-[#18a7ff] bg-clip-text text-transparent"
            }
          >
            ++
          </span>
        </span>
      )}
    </div>
  );
}
