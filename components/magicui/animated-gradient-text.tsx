import type { ReactNode } from "react";

export function AnimatedGradientText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`bg-[linear-gradient(110deg,#7c2cff,45%,#246bff,55%,#18a7ff)] bg-[length:220%_100%] bg-clip-text text-transparent animate-studypp-gradient ${className}`}
    >
      {children}
    </span>
  );
}
