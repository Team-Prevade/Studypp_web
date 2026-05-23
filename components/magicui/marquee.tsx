import type { ReactNode } from "react";

export function Marquee({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] ${className}`}>
      <div className="flex min-w-full shrink-0 animate-studypp-marquee gap-3">
        {children}
        {children}
      </div>
    </div>
  );
}
