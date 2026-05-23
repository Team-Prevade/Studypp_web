export function BorderBeam({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-[inherit] p-px [background:linear-gradient(90deg,transparent,rgba(124,44,255,.75),rgba(24,167,255,.85),transparent)] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] animate-studypp-border ${className}`}
    />
  );
}
