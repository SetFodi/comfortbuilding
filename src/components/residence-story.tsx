"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/types";

const COPY = {
  en: {
    heading: ["Inside", "Nº65"], steps: ["Street exterior", "Floor plan", "Living room"],
    street: "Eight storeys on Parnavaz Mepe Street in Batumi. Every apartment opens onto a balcony.",
    plan: "Find the highlighted apartment on the sales drawing, facing Parnavaz Mepe Street.",
    room: "Oak, linen and afternoon light in the one-bedroom layout. Walk from the living room out onto the balcony in 3D.",
    tour: "Enter the 3D tour", prices: "Prices & plans", floor: "Floor", unit: "Apartment",
    study: "A residence in detail", visual: "Architectural visualization", interior: "Interior visualization",
  },
  ka: {
    heading: ["ფარნავაზის", "№65"], steps: ["ქუჩის ხედი", "სართულის გეგმა", "მისაღები ოთახი"],
    street: "რვასართულიანი სახლი ბათუმში, ფარნავაზ მეფის ქუჩაზე. ყველა ბინას საკუთარი აივანი აქვს.",
    plan: "სართულის გეგმაზე მონიშნული ბინა ფარნავაზ მეფის ქუჩას გადაჰყურებს.",
    room: "ერთსაძინებლიანი ბინის ინტერიერში მუხა და სელის ქსოვილია გამოყენებული. 3D ტურში მისაღებიდან აივანზე გასვლაც შეგიძლიათ.",
    tour: "3D ტურში შესვლა", prices: "ფასები და გეგმები", floor: "სართული", unit: "ბინა",
    study: "პროექტი დეტალურად", visual: "არქიტექტურული ვიზუალიზაცია", interior: "ინტერიერის ვიზუალიზაცია",
  },
  ru: {
    heading: ["Внутри дома", "№65"], steps: ["Уличный фасад", "План этажа", "Гостиная"],
    street: "Восемь этажей на улице Парнаваз Мепе в Батуми. У каждой квартиры свой балкон.",
    plan: "На поэтажном плане выделена квартира, окна которой выходят на улицу Парнаваз Мепе.",
    room: "Дуб, лён и послеполуденный свет в квартире с одной спальней. В 3D-туре можно пройти из гостиной на балкон.",
    tour: "Войти в 3D-тур", prices: "Цены и планы", floor: "Этаж", unit: "Квартира",
    study: "Проект в деталях", visual: "Архитектурная визуализация", interior: "Визуализация интерьера",
  },
} as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const STORY_POSITIONS = [0, 0.5, 1] as const;
const SCROLL_QUERY = "(prefers-reduced-motion: no-preference) and (min-width: 801px) and (min-height: 560px), (prefers-reduced-motion: no-preference) and (max-width: 800px) and (min-height: 740px)";

interface StoryProps {
  readonly lang: Lang;
  readonly name: string;
  readonly floor: number;
  readonly number: string;
  readonly area: string;
  readonly floorImage: string;
  readonly outline: string;
  readonly planViewBox: string;
  readonly projectHref: string;
}

export function ResidenceStory({ lang, name, floor, number, area, floorImage, outline, planViewBox, projectHref }: StoryProps) {
  const copy = COPY[lang];
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const selectRef = useRef<(index: number) => void>(() => {});
  const tourHref = `${projectHref}?apartment=${number}#explore`;

  useEffect(() => {
    const outer = section.current;
    const inner = stage.current;
    if (!outer || !inner) return;
    const query = window.matchMedia(SCROLL_QUERY);
    let frame = 0;
    let offset = 0;
    let travel = 0;
    let previous = -1;
    let lastChapter = 0;

    function paint(progress: number) {
      if (progress === previous) return;
      previous = progress;
      const plan = clamp((progress - 0.12) / 0.24);
      const room = clamp((progress - 0.62) / 0.24);
      inner!.style.setProperty("--plan-edge", `${(1 - plan) * 100}%`);
      inner!.style.setProperty("--room-edge", `${(1 - room) * 100}%`);
      inner!.style.setProperty("--street-scale", String(1 + progress * 0.1));
      inner!.style.setProperty("--story-travel", `${progress * 100}%`);
      const nextChapter = progress < 0.26 ? 0 : progress < 0.76 ? 1 : 2;
      if (nextChapter !== lastChapter) {
        lastChapter = nextChapter;
        setChapter(nextChapter);
      }
    }

    function draw() {
      frame = 0;
      if (query.matches && travel > 0) paint(clamp((offset - outer!.getBoundingClientRect().top) / travel));
    }

    function schedule() {
      if (!frame && query.matches) frame = requestAnimationFrame(draw);
    }

    function measure() {
      outer!.dataset.pinned = String(query.matches);
      offset = parseFloat(getComputedStyle(inner!).top) || 0;
      travel = outer!.offsetHeight - inner!.offsetHeight;
      if (query.matches) schedule();
      else paint(STORY_POSITIONS[lastChapter]);
    }

    selectRef.current = (index) => {
      if (!query.matches || travel <= 0) {
        paint(STORY_POSITIONS[index]);
        return;
      }
      const top = window.scrollY + outer.getBoundingClientRect().top - offset;
      window.scrollTo({ top: top + travel * STORY_POSITIONS[index], behavior: "smooth" });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    window.addEventListener("scroll", schedule, { passive: true });
    query.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      query.removeEventListener("change", measure);
    };
  }, []);

  const descriptions = [copy.street, copy.plan, copy.room];
  const captions = [copy.visual, `${copy.floor} ${floor} · ${copy.unit} ${number}`, copy.interior];

  return (
    <section ref={section} id="inside" className="residence-story" data-project-slug="parnavaz-65">
      <div ref={stage} className="story-stage" data-chapter={chapter}>
        <div className="story-editorial">
          <div>
            <p className="studio-label"><i aria-hidden />{copy.study}</p>
            <h2 className="story-heading">{copy.heading[0]} <em>{copy.heading[1]}</em></h2>
            <p className="story-address">{name}</p>
          </div>
          <div className="story-chapters" role="group" aria-label={name}>
            {copy.steps.map((label, index) => (
              <button key={label} type="button" aria-pressed={chapter === index} onClick={() => selectRef.current(index)}>
                <small>0{index + 1}</small><span>{label}</span><i aria-hidden>↗</i>
              </button>
            ))}
          </div>
          <div className="story-notes">
            <p key={chapter}>{descriptions[chapter]}</p>
            <div className="studio-actions">
              <Link href={tourHref} className="studio-button">{copy.tour}<span aria-hidden>↗</span></Link>
              <Link href={`${projectHref}#prices`} className="studio-text-link">{copy.prices}</Link>
            </div>
          </div>
        </div>
        <figure className="story-figure">
          <div className="story-images">
            <div className="story-street" aria-hidden={chapter !== 0}>
              <Image src="/images/experimental-ai/parnavaz-65-dusk.webp" alt={`${name} · ${copy.visual}`} fill sizes="(min-width: 801px) 62vw, 100vw" />
            </div>
            <div className="story-plan" aria-hidden={chapter !== 1}>
              <div className="plan-legend"><span>{copy.floor} {floor}</span><span>{area}</span></div>
              <div className="story-drawing">
                <Image src={floorImage} alt={`${copy.floor} ${floor} · ${copy.unit} ${number}`} width={3190} height={1174} loading="eager" fetchPriority="low" sizes="(min-width: 801px) 57vw, 94vw" />
                <svg aria-hidden viewBox={planViewBox}><polygon points={outline} /></svg>
              </div>
              <div className="plan-legend"><span className="plan-key">{copy.unit} {number}</span><span>{name}</span></div>
            </div>
            <div className="story-room" aria-hidden={chapter !== 2}>
              <Image src="/images/experimental-ai/parnavaz-65-living-room.webp" alt={`${copy.unit} ${number} · ${copy.interior}`} fill loading="eager" fetchPriority="low" sizes="(min-width: 801px) 62vw, 100vw" />
            </div>
          </div>
          <figcaption><span>0{chapter + 1} / 03</span><span>{captions[chapter]}</span></figcaption>
          <div className="story-progress" aria-hidden><i /></div>
        </figure>
      </div>
    </section>
  );
}
