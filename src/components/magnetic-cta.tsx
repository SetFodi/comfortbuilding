"use client";

import Link from "next/link";
import { useRef } from "react";

const MAGNET_STRENGTH = 0.28;

interface MagneticCtaProps {
  readonly href: string;
  readonly label: string;
}

/** Circular call-to-action that leans toward the cursor. */
export function MagneticCta({ href, label }: MagneticCtaProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * MAGNET_STRENGTH;
    const y = (event.clientY - rect.top - rect.height / 2) * MAGNET_STRENGTH;
    element.style.transform = `translate(${x}px, ${y}px)`;
  };

  const onMouseLeave = () => {
    const element = ref.current;
    if (!element) return;
    element.style.transform = "translate(0px, 0px)";
  };

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative flex size-24 items-center justify-center rounded-full bg-brass text-ink shadow-xl transition-[transform,background-color] duration-500 ease-out hover:bg-brass-bright md:size-28"
    >
      <span className="px-2 text-center text-[10px] font-bold tracking-[0.1em] uppercase md:tracking-[0.16em]">
        {label}
      </span>
      <span
        aria-hidden
        className="absolute inset-1.5 scale-90 rounded-full border border-ink/15 transition-transform duration-500 group-hover:scale-100"
      />
    </Link>
  );
}
