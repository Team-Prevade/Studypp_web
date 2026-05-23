"use client";

import { useEffect, useRef, useState } from "react";

export function LandingCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reducedMotion) return;

    setEnabled(true);

    const handleMouseMove = (event: MouseEvent) => {
      positionRef.current.targetX = event.clientX;
      positionRef.current.targetY = event.clientY;
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, [data-cursor='magnetic']")) {
        cursorRef.current?.classList.add("landing-cursor--active");
      }
    };

    const handlePointerOut = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, [data-cursor='magnetic']")) {
        cursorRef.current?.classList.remove("landing-cursor--active");
      }
    };

    const animate = () => {
      const position = positionRef.current;
      position.currentX += (position.targetX - position.currentX) * 0.22;
      position.currentY += (position.targetY - position.currentY) * 0.22;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${position.currentX}px, ${position.currentY}px, 0) translate(-50%, -50%)`;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);
    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (!enabled) return null;

  return <div ref={cursorRef} className="landing-cursor" aria-hidden />;
}
