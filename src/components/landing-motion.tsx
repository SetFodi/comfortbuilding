"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function LandingMotion({ children }: { readonly children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = root.current;
    if (!page) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const photographs = Array.from(page.querySelectorAll<HTMLElement>("[data-drift]"));
    const moving = new Set<HTMLElement>();
    let frame = 0;

    const draw = () => {
      frame = 0;
      if (preference.matches) return;
      for (const element of moving) {
        const rect = element.getBoundingClientRect();
        const fraction = (innerHeight - rect.top) / (innerHeight + rect.height) - 0.5;
        element.style.setProperty("--photo-drift", `${Math.max(-1, Math.min(1, fraction * 2)) * 5}%`);
      }
    };
    const schedule = () => {
      if (moving.size && !preference.matches && !frame) frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          moving.add(element);
          element.dataset.entered = "true";
        } else moving.delete(element);
      }
      schedule();
    });
    photographs.forEach((item) => observer.observe(item));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", schedule);
    };
  }, []);

  return <div className="studio-home" ref={root}>{children}</div>;
}
