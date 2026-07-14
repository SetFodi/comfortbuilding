"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface RevealProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly delayMs?: number;
}

/** Fades content up once it scrolls into view. Motion-safe via CSS. */
export function Reveal({ children, className = "", delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style =
    delayMs > 0
      ? ({ "--reveal-delay": `${delayMs}ms` } as CSSProperties)
      : undefined;

  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
