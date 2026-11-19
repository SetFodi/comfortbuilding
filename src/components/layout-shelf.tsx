"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/types";

interface LayoutStudy {
  readonly id: string;
  readonly area: string;
  readonly bedrooms: number;
  readonly href: string;
}

const COPY = {
  en: { title: ["Apartment", "plans"], bedroom: "1 bedroom", bedrooms: "2 bedrooms", prev: "Previous plans", next: "Next plans" },
  ka: { title: ["ბინების", "გეგმები"], bedroom: "1 საძინებელი", bedrooms: "2 საძინებელი", prev: "წინა გეგმები", next: "შემდეგი გეგმები" },
  ru: { title: ["Планировки", "квартир"], bedroom: "1 спальня", bedrooms: "2 спальни", prev: "Предыдущие планы", next: "Следующие планы" },
} as const;

export function LayoutShelf({ lang, project, layouts }: {
  readonly lang: Lang;
  readonly project: string;
  readonly layouts: readonly LayoutStudy[];
}) {
  const copy = COPY[lang];
  const rail = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ first: true, last: false });
  const measure = () => {
    const node = rail.current;
    if (!node) return;
    const first = node.scrollLeft < 3;
    const last = node.scrollLeft + node.clientWidth >= node.scrollWidth - 3;
    setRange((old) => old.first === first && old.last === last ? old : { first, last });
  };
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    if (rail.current) observer.observe(rail.current);
    return () => observer.disconnect();
  }, []);
  function advance(step: number) {
    const node = rail.current;
    const first = node?.children[0];
    const second = node?.children[1];
    if (!node || !first || !second) return;
    const stride = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    node.scrollBy({ left: step * stride, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return (
    <section className="layout-library">
      <div className="studio-wrap">
        <div className="library-heading">
          <div>
            <p className="studio-label"><i aria-hidden />{project}</p>
            <h2 className="monograph-title">{copy.title[0]} <em>{copy.title[1]}</em></h2>
          </div>
          <div className="shelf-controls">
            <button type="button" disabled={range.first} aria-label={copy.prev} onClick={() => advance(-1)}>←</button>
            <button type="button" disabled={range.last} aria-label={copy.next} onClick={() => advance(1)}>→</button>
          </div>
        </div>
        <div className="plan-shelf" ref={rail} onScroll={measure}>
          {layouts.map((layout) => (
            <Link href={layout.href} key={layout.id} className="plan-study">
              <div className="plan-specimen">
                <Image src={`/images/projects/parnavaz-65/plan-studies/${layout.id}.webp`}
                  alt={`${copy.title.join(" ")} · ${layout.area}`}
                  fill sizes="(min-width: 801px) 33vw, 80vw" />
              </div>
              <div className="plan-caption">
                <div><span>{layout.area} <small>{{ ka: "მ²", en: "m²", ru: "м²" }[lang]}</small></span>
                  <p>{layout.bedrooms === 1 ? copy.bedroom : copy.bedrooms}</p></div>
                <span aria-hidden>↗</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
