export function DotPattern({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(36,107,255,.18)_1px,transparent_1.5px)] bg-[size:24px_24px] ${className}`}
    />
  );
}
