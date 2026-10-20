"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ApartmentModel } from "@/lib/apartment-model";
import type { Lang } from "@/lib/types";
import { createApartmentScene, type ApartmentScene, type ApartmentView } from "./apartment-model-scene";

const COPY = {
  ka: {
    dollhouse: "3D ხედი",
    inside: "შიგნით",
    top: "ზედხედი",
    reset: "ხედის აღდგენა",
    zoomIn: "მიახლოება",
    zoomOut: "დაშორება",
    loading: "ბინის სივრცე იტვირთება",
    drag: "გადაათრიეთ მოსაბრუნებლად · გაშალეთ ორი თითი მისაახლოებლად",
    insideHint: "გადაათრიეთ სივრცის დასათვალიერებლად",
    unavailable: "3D ხედი ამ მოწყობილობაზე ვერ ჩაიტვირთა.",
    fallback: "შეგიძლიათ ბინის განლაგება დიზაინის სურათზე დაათვალიეროთ.",
    image: "ბინის განლაგება და ინტერიერის დიზაინი",
    canvas: "ბინის ინტერაქტიული სამგანზომილებიანი მოდელი",
    rooms: "ოთახის არჩევა",
    living: "მისაღები",
    bedroom: "საძინებელი",
    bedroom2: "მეორე საძინებელი",
    kitchen: "სამზარეულო",
  },
  en: {
    dollhouse: "3D view",
    inside: "Inside",
    top: "Top view",
    reset: "Reset view",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    loading: "Preparing your apartment",
    drag: "Drag to rotate · Pinch to zoom",
    insideHint: "Drag to look around",
    unavailable: "The 3D view could not load on this device.",
    fallback: "You can explore the apartment in the original design below.",
    image: "Apartment layout and interior design",
    canvas: "Interactive three-dimensional apartment model",
    rooms: "Choose a room",
    living: "Living room",
    bedroom: "Bedroom",
    bedroom2: "Second bedroom",
    kitchen: "Kitchen",
  },
  ru: {
    dollhouse: "3D-вид",
    inside: "Внутри",
    top: "Вид сверху",
    reset: "Сбросить вид",
    zoomIn: "Приблизить",
    zoomOut: "Отдалить",
    loading: "Загружаем пространство квартиры",
    drag: "Перетащите для поворота · Разведите пальцы для приближения",
    insideHint: "Перетащите, чтобы осмотреться",
    unavailable: "Не удалось загрузить 3D-вид на этом устройстве.",
    fallback: "Планировку можно рассмотреть на оригинальном изображении ниже.",
    image: "Планировка и дизайн интерьера квартиры",
    canvas: "Интерактивная трёхмерная модель квартиры",
    rooms: "Выбрать комнату",
    living: "Гостиная",
    bedroom: "Спальня",
    bedroom2: "Вторая спальня",
    kitchen: "Кухня",
  },
} as const;

function ViewIcon({ view }: { view: ApartmentView }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      {view === "dollhouse" ? (
        <>
          <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z" />
          <path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5" />
        </>
      ) : view === "inside" ? (
        <>
          <path d="M4 21V4l10-2v19M14 5h6v16M9.5 12.5h.01M2 21h20" />
        </>
      ) : (
        <>
          <path d="M3 3h18v18H3zM3 13h8V3M11 13v8M16 3v7h5" />
        </>
      )}
    </svg>
  );
}

export default function ApartmentModelViewer(props: { model: ApartmentModel; lang: Lang }) {
  return <ApartmentModelExperience key={props.model.id} {...props} />;
}

function ApartmentModelExperience({ model, lang }: { model: ApartmentModel; lang: Lang }) {
  const copy = COPY[lang];
  const canvasHost = useRef<HTMLDivElement>(null);
  const scene = useRef<ApartmentScene | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [view, setView] = useState<ApartmentView>("dollhouse");
  const [room, setRoom] = useState(model.viewpoints[0]?.id);

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    let cancelled = false;
    let currentScene: ApartmentScene | null = null;
    const fail = () => {
      if (cancelled) return;
      setStatus("fallback");
      currentScene?.dispose();
      currentScene = null;
      scene.current = null;
    };
    try {
      currentScene = createApartmentScene(host, model, () => {
        if (!cancelled) setStatus("ready");
      }, fail);
      scene.current = currentScene;
    } catch {
      queueMicrotask(fail);
    }
    return () => {
      cancelled = true;
      currentScene?.dispose();
      scene.current = null;
    };
  }, [model]);

  const changeView = (next: ApartmentView) => {
    setView(next);
    scene.current?.setView(next, room);
  };

  const iconButton = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-ink/75 text-cream backdrop-blur-md transition hover:border-brass/60 hover:text-brass focus-visible:outline-brass disabled:opacity-40";

  return (
    <div className="flex h-full min-h-[340px] flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#1b1e1d]" data-state={status} data-model-id={model.id}>
      {status === "fallback" ? (
        <div className="p-5 sm:p-7">
          <p className="text-sm text-cream">{copy.unavailable}</p>
          <p className="mt-2 text-sm leading-relaxed text-cream/60">{copy.fallback}</p>
          <Image
            src={model.source.src}
            alt={copy.image}
            width={model.source.width}
            height={model.source.height}
            sizes="(max-width: 768px) 94vw, 1050px"
            className="mt-5 h-auto w-full rounded-xl bg-paper"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-3 py-3 sm:px-5">
            <div className="flex max-w-full items-center gap-1 rounded-full bg-black/20 p-1" role="group" aria-label={copy.canvas}>
              {(["dollhouse", "inside", "top"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => changeView(mode)}
                  aria-pressed={view === mode}
                  disabled={status !== "ready" || (mode === "inside" && model.viewpoints.length === 0)}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-xs transition duration-200 sm:px-4 sm:text-sm ${
                    view === mode ? "bg-brass text-ink" : "text-cream/65 hover:text-cream"
                  } disabled:opacity-45`}
                >
                  <ViewIcon view={mode} />
                  {copy[mode]}
                </button>
              ))}
            </div>
            <span className="hidden font-mono text-[10px] tracking-[0.22em] text-brass/60 sm:inline" aria-hidden="true">
              {model.area.toFixed(2)} M²
            </span>
          </div>
          <div className="relative min-h-[250px] flex-1" style={{ background: "radial-gradient(ellipse at 50% 40%, #5b5b50 0%, #353a34 43%, #1b1e1d 78%)" }}>
            <div
              ref={canvasHost}
              className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
              role="img"
              aria-label={copy.canvas}
              aria-busy={status === "loading"}
            />
            {status === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#1b1e1d]/80" role="status">
                <div className="h-10 w-10 animate-spin rounded-full border border-brass/15 border-t-brass motion-reduce:animate-none" />
                <p className="text-xs tracking-wide text-cream/70">{copy.loading}</p>
              </div>
            )}
            {status === "ready" && (
              <>
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <button type="button" className={iconButton} onClick={() => scene.current?.reset()} aria-label={copy.reset} title={copy.reset}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path d="M4 10a8 8 0 1 1 .6 6M4 4v6h6" />
                    </svg>
                  </button>
                  <button type="button" className={iconButton} onClick={() => scene.current?.zoom(1)} aria-label={copy.zoomIn} title={copy.zoomIn}>
                    <span className="text-xl font-light" aria-hidden="true">+</span>
                  </button>
                  <button type="button" className={iconButton} onClick={() => scene.current?.zoom(-1)} aria-label={copy.zoomOut} title={copy.zoomOut}>
                    <span className="text-xl font-light" aria-hidden="true">−</span>
                  </button>
                </div>
                <p className="pointer-events-none absolute bottom-5 left-4 max-w-[65%] text-[10px] leading-relaxed text-cream/55 sm:left-5 sm:text-xs">
                  {view === "inside" ? copy.insideHint : copy.drag}
                </p>
              </>
            )}
          </div>
          {view === "inside" && status === "ready" && (
            <div className="flex flex-wrap gap-2 border-t border-white/8 px-4 py-3" role="group" aria-label={copy.rooms}>
              {model.viewpoints.map((viewpoint) => (
                <button
                  type="button"
                  key={viewpoint.id}
                  aria-pressed={room === viewpoint.id}
                  onClick={() => {
                    setRoom(viewpoint.id);
                    scene.current?.setView("inside", viewpoint.id);
                  }}
                  className={`min-h-11 rounded-full border px-4 text-xs transition ${
                    room === viewpoint.id ? "border-brass/65 bg-brass/10 text-brass" : "border-white/10 text-cream/65 hover:border-brass/40 hover:text-cream"
                  }`}
                >
                  {copy[viewpoint.id]}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
