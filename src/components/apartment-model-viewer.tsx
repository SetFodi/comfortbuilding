"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ApartmentModel } from "@/lib/apartment-model";
import type { Lang } from "@/lib/types";
import { createApartmentScene, type ApartmentScene, type ApartmentView, type WalkthroughInteraction } from "./apartment-model-scene";
import type { WalkthroughPose, WalkthroughState } from "./apartment-walkthrough-controls";

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
    bathroom: "აბაზანა",
    walkthrough: "გასეირნება",
    experimental: "ექსპერიმენტული რეჟიმი",
    enterTitle: "შეაბიჯეთ ბინაში",
    warning: "ეს ექსპერიმენტული ფუნქციაა და შეიძლება 3D მოდელზე ნაკლებად ზუსტი იყოს. ზომები, ავეჯი და მოპირკეთება საორიენტაციოა.",
    start: "გასეირნების დაწყება",
    move: "მოძრაობა",
    look: "მაუსით მიმოხედვა",
    pause: "პაუზა / მაუსის გათავისუფლება",
    dragLook: "დააწკაპუნეთ სივრცეზე · WASD მოძრაობა · გადაათრიეთ მოსახედად",
    stick: "ჯოისტიკით მოძრაობა",
    swipe: "ეკრანზე გაასრიალეთ მიმოსახედად",
    pauseTouch: "პაუზა",
    paused: "გასეირნება შეჩერებულია",
    resume: "გაგრძელება",
    tvOn: "ტელევიზორის ჩართვა",
    tvOff: "ტელევიზორის გამორთვა",
    desktop: "გასეირნება ხელმისაწვდომია კომპიუტერზე, კლავიატურითა და მაუსით.",
    map: "თქვენი მდებარეობა",
    prototype: "3D კონცეფცია · ბინა",
    ready: "სივრცე მზადაა",
    preparing: "სივრცე მზადდება",
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
    bathroom: "Bathroom",
    walkthrough: "Walk through",
    experimental: "Experimental",
    enterTitle: "Step into the apartment",
    warning: "This is an experimental feature and may be less accurate than the 3D model. Dimensions, furniture and finishes are approximate.",
    start: "Start walkthrough",
    move: "Move",
    look: "Mouse to look",
    pause: "Pause / release mouse",
    dragLook: "Click the scene · WASD to move · Drag to look",
    stick: "Move with the joystick",
    swipe: "Swipe the screen to look around",
    pauseTouch: "Pause",
    paused: "Walkthrough paused",
    resume: "Resume walkthrough",
    tvOn: "Turn on TV",
    tvOff: "Turn off TV",
    desktop: "The walkthrough is available on a desktop with a keyboard and mouse.",
    map: "You are here",
    prototype: "3D concept · Apartment",
    ready: "Apartment ready",
    preparing: "Preparing the apartment",
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
    bathroom: "Ванная",
    walkthrough: "Прогулка",
    experimental: "Экспериментальный режим",
    enterTitle: "Войдите в квартиру",
    warning: "Это экспериментальная функция. Она может быть менее точной, чем 3D-модель. Размеры, мебель и отделка показаны ориентировочно.",
    start: "Начать прогулку",
    move: "Движение",
    look: "Осмотр мышью",
    pause: "Пауза / освободить мышь",
    dragLook: "Нажмите на сцену · WASD для движения · Перетащите для осмотра",
    stick: "Джойстик — движение",
    swipe: "Проведите по экрану, чтобы осмотреться",
    pauseTouch: "Пауза",
    paused: "Прогулка приостановлена",
    resume: "Продолжить",
    tvOn: "Включить телевизор",
    tvOff: "Выключить телевизор",
    desktop: "Прогулка доступна на компьютере с клавиатурой и мышью.",
    map: "Вы здесь",
    prototype: "3D-концепция · Квартира",
    ready: "Квартира готова",
    preparing: "Готовим квартиру",
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
      ) : view === "walkthrough" ? (
        <>
          <circle cx="12" cy="4" r="2.2" />
          <path d="m7 21 2-7V9h6v5l2 7M9 9l-4 5m10-5 4 5M9 14h6" />
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

const desktopQuery = "(min-width: 900px) and (hover: hover) and (pointer: fine)";
function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const isDesktop = () => window.matchMedia(desktopQuery).matches;
const serverDesktop = () => false;

const touchQuery = "(pointer: coarse)";
function subscribeTouch(callback: () => void) {
  const query = window.matchMedia(touchQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const isTouch = () => window.matchMedia(touchQuery).matches;
const portraitQuery = "(orientation: portrait)";
function subscribePortrait(callback: () => void) {
  const query = window.matchMedia(portraitQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const isPortrait = () => window.matchMedia(portraitQuery).matches;

/** Android can go fullscreen and hold landscape; iPhone ignores both, harmlessly. */
async function enterLandscape() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    await orientation.lock?.("landscape");
  } catch {
    // Not supported here; the stage turns itself instead.
  }
}

function leaveLandscape() {
  try {
    screen.orientation?.unlock?.();
    if (document.fullscreenElement) void document.exitFullscreen();
  } catch {
    // Nothing to undo.
  }
}

/** Game-style thumbstick: drag the knob to walk, further to walk faster. */
function Joystick({ label, onMove, turned = false }: { label: string; onMove: (x: number, y: number) => void; turned?: boolean }) {
  const base = useRef<HTMLDivElement>(null);
  const finger = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const reach = 36;
  const track = (event: React.PointerEvent) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = event.clientX - (rect.left + rect.width / 2);
    const sy = event.clientY - (rect.top + rect.height / 2);
    // On a stage turned a quarter clockwise, screen down is the stick's right.
    let [dx, dy] = turned ? [sy, -sx] : [sx, sy];
    const length = Math.hypot(dx, dy);
    if (length > reach) {
      dx *= reach / length;
      dy *= reach / length;
    }
    setKnob({ x: dx, y: dy });
    onMove(dx / reach, -dy / reach);
  };
  const release = () => {
    finger.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };
  return (
    <div ref={base} role="application" aria-label={label} data-walkthrough-joystick
      className="absolute bottom-4 left-4 size-28 touch-none select-none rounded-full border border-white/25 bg-ink/45 shadow-xl backdrop-blur-md"
      onPointerDown={(event) => {
        event.preventDefault();
        finger.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        track(event);
      }}
      onPointerMove={(event) => { if (event.pointerId === finger.current) track(event); }}
      onPointerUp={(event) => { if (event.pointerId === finger.current) release(); }}
      onPointerCancel={release}>
      <span className="pointer-events-none absolute inset-4 rounded-full border border-white/10" aria-hidden />
      <span className="pointer-events-none absolute top-1/2 left-1/2 -mt-6 -ml-6 size-12 rounded-full border border-brass-bright/60 bg-brass/90 shadow-lg"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} aria-hidden />
    </div>
  );
}

function OrientationMap({ model, pose, label }: { model: ApartmentModel; pose: WalkthroughPose | null; label: string }) {
  // Plan coordinates are normalized, so the map keeps the apartment's real proportions.
  const height = Math.round(100 * model.size.depth / model.size.width);
  return (
    <div className="w-28 rounded-xl border border-white/15 bg-ink/80 p-2.5 shadow-lg backdrop-blur-md">
      <svg viewBox={`0 0 100 ${height}`} className="h-28 w-full" role="img" aria-label={label}>
        <polygon points={model.footprint.map(([x, y]) => `${x * 100},${y * height}`).join(" ")} fill="#c5b58f" fillOpacity=".12" stroke="#c5b58f" strokeOpacity=".45" strokeWidth="1" />
        {model.walls.map(([a, b], index) => <line key={index} x1={a[0] * 100} y1={a[1] * height} x2={b[0] * 100} y2={b[1] * height} stroke="#e8dfcb" strokeOpacity=".7" strokeWidth="1.6" />)}
        {pose && <g transform={`translate(${pose.x * 100} ${pose.y * height}) rotate(${-pose.yaw * 180 / Math.PI})`} data-player-x={pose.x.toFixed(4)} data-player-y={pose.y.toFixed(4)}>
          <path d="M0 0 -8 -16 Q0 -20 8 -16Z" fill="#d9bf7b" fillOpacity=".3" />
          <circle r="3" fill="#e7ca80" stroke="#1b1e1d" strokeWidth="1" />
        </g>}
      </svg>
      <p className="mt-1 text-center font-mono text-[8px] tracking-wider text-cream/60">{label}</p>
    </div>
  );
}

export default function ApartmentModelViewer(props: { model: ApartmentModel; lang: Lang; allowWalkthrough?: boolean; unit?: string; area?: number }) {
  return <ApartmentModelExperience key={props.model.id} {...props} />;
}

function ApartmentModelExperience({ model, lang, allowWalkthrough = false, unit, area = model.area }: { model: ApartmentModel; lang: Lang; allowWalkthrough?: boolean; unit?: string; area?: number }) {
  const copy = COPY[lang];
  const canvasHost = useRef<HTMLDivElement>(null);
  const scene = useRef<ApartmentScene | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [view, setView] = useState<ApartmentView>("dollhouse");
  const [room, setRoom] = useState(model.viewpoints[0]?.id);
  const [walkState, setWalkState] = useState<WalkthroughState>("ready");
  const [pose, setPose] = useState<WalkthroughPose | null>(null);
  const [interaction, setInteraction] = useState<WalkthroughInteraction>(null);
  const [showNotice, setShowNotice] = useState(false);
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, serverDesktop);
  // Phones and tablets walk with an on-screen joystick and look by swiping.
  const touch = useSyncExternalStore(subscribeTouch, isTouch, serverDesktop) && !desktop;
  const canWalk = desktop || touch;
  const portrait = useSyncExternalStore(subscribePortrait, isPortrait, serverDesktop);
  // On touch screens the walkthrough fills the screen, turned to landscape
  // when the phone is held upright (even with rotation lock on).
  const walkthroughAvailable = allowWalkthrough;
  const walking = view === "walkthrough";
  const immersive = touch && walking;
  const turned = immersive && portrait;

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
      }, fail, (next) => {
        if (!cancelled) setWalkState(next);
      }, (next) => {
        if (!cancelled) setPose(next);
      }, (next) => {
        if (!cancelled) setInteraction(next);
      });
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
    if (next === "walkthrough" && (!walkthroughAvailable || !canWalk)) return;
    if (next !== "walkthrough" && touch) leaveLandscape();
    setView(next);
    setShowNotice(next === "walkthrough");
    scene.current?.setView(next, room);
  };

  useEffect(() => {
    if (!canWalk) scene.current?.pauseWalkthrough();
  }, [canWalk]);

  useEffect(() => {
    scene.current?.setScreenTurn(turned ? 1 : 0);
  }, [turned]);

  useEffect(() => () => {
    if (touch) leaveLandscape();
  }, [touch]);

  const startWalking = () => {
    if (!canWalk || !walkthroughAvailable) return;
    setShowNotice(false);
    if (touch) void enterLandscape();
    scene.current?.startWalkthrough({ touch });
  };

  const iconButton = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-ink/75 text-cream backdrop-blur-md transition hover:border-brass/60 hover:text-brass focus-visible:outline-brass disabled:opacity-40";

  return (
    <div className={immersive
      ? "fixed z-[400] flex flex-col overflow-hidden bg-[#1b1e1d]"
      : "flex h-full min-h-[340px] flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#1b1e1d]"}
      style={turned
        ? { top: 0, left: "100vw", width: "100dvh", height: "100vw", transform: "rotate(90deg)", transformOrigin: "top left" }
        : immersive ? { inset: 0, width: "100vw", height: "100dvh" } : undefined}
      data-state={status} data-model-id={model.id} data-view={view} data-walk-state={walking ? walkState : undefined} data-immersive={immersive ? (turned ? "turned" : "full") : undefined}>
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
          <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-3 sm:px-5 ${immersive ? "py-1.5" : "py-3"}`}>
            {walkthroughAvailable ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] tracking-[.14em] text-brass/75">{area.toFixed(2)} M²</span>
                  <span className="hidden h-4 w-px bg-white/15 sm:block" />
                  <span className="hidden text-[10px] text-cream/40 sm:block">{unit ? `${copy.prototype} ${unit}` : copy.prototype}</span>
                </div>
                <div className="ml-auto flex gap-1 rounded-full border border-white/10 bg-black/20 p-1" role="group" aria-label={copy.canvas}>
                  {(["dollhouse", "walkthrough"] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => changeView(mode)}
                      aria-pressed={mode === "dollhouse" ? !walking : walking}
                      disabled={status !== "ready" || (mode === "walkthrough" && !canWalk)}
                      title={mode === "walkthrough" && !canWalk ? copy.desktop : copy[mode]}
                      className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-xs transition ${((mode === "dollhouse" && !walking) || view === mode) ? "bg-brass text-ink" : "text-cream/65 hover:text-cream"} disabled:opacity-40`}>
                      <ViewIcon view={mode} />{copy[mode]}
                    </button>
                  ))}
                </div>
              </>
            ) : <div className="flex max-w-full items-center gap-1 rounded-full bg-black/20 p-1" role="group" aria-label={copy.canvas}>
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
            </div>}
            {!walkthroughAvailable && <span className="hidden font-mono text-[10px] tracking-[0.22em] text-brass/60 sm:inline" aria-hidden="true">
              {area.toFixed(2)} M²
            </span>}
          </div>
          <div className="relative min-h-[250px] flex-1" style={{ background: "radial-gradient(ellipse at 50% 40%, #5b5b50 0%, #353a34 43%, #1b1e1d 78%)" }}>
            <div
              ref={canvasHost}
              className={`absolute inset-0 h-full w-full ${walking ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
              role={walking ? "group" : "img"}
              aria-label={walking ? `${copy.walkthrough}. WASD. ${copy.look}. Escape: ${copy.pause}` : copy.canvas}
              aria-busy={status === "loading"}
            />
            {status === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#1b1e1d]/80" role="status">
                <div className="h-10 w-10 animate-spin rounded-full border border-brass/15 border-t-brass motion-reduce:animate-none" />
                <p className="text-xs tracking-wide text-cream/70">{copy.loading}</p>
              </div>
            )}
            {status === "ready" && !walking && (
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
            {status === "ready" && walkthroughAvailable && !walking && (
              <button type="button" onClick={() => changeView(view === "top" ? "dollhouse" : "top")} aria-pressed={view === "top"}
                className="absolute top-4 left-4 flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-ink/75 px-4 text-xs text-cream/80 backdrop-blur-md hover:text-brass">
                <ViewIcon view="top" />{copy.top}
              </button>
            )}
            {walking && !showNotice && canWalk && (
              <>
                <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 rounded-full border border-brass/25 bg-ink/65 px-3 py-2 text-[9px] tracking-widest text-brass backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-brass" />{copy.experimental}
                </div>
                <div className="pointer-events-none absolute right-3 top-3 origin-top-right scale-75 sm:right-5 sm:top-5 sm:scale-100"><OrientationMap model={model} pose={pose} label={copy.map} /></div>
                {(walkState === "walking" || walkState === "drag") && (
                  <span className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200 ${interaction ? "size-3 border-brass bg-brass/20" : "size-1.5 border-white/80 bg-black/20"}`} aria-hidden />
                )}
                {interaction && touch && (walkState === "walking" || walkState === "drag") && (
                  <button type="button" onClick={() => scene.current?.interact()} data-walkthrough-prompt
                    className="absolute left-1/2 top-1/2 mt-7 flex min-h-11 -translate-x-1/2 items-center gap-2.5 rounded-full border border-brass/50 bg-ink/85 py-1.5 pl-1.5 pr-4 text-xs text-cream shadow-lg backdrop-blur-md">
                    <span className="flex size-7 items-center justify-center rounded-full bg-brass text-ink" aria-hidden>⏻</span>
                    {interaction.on ? copy.tvOff : copy.tvOn}
                  </button>
                )}
                {interaction && !touch && (walkState === "walking" || walkState === "drag") && (
                  <div className="pointer-events-none absolute left-1/2 top-1/2 mt-7 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-brass/40 bg-ink/80 py-1.5 pl-1.5 pr-4 text-xs text-cream shadow-lg backdrop-blur-md" role="status" data-walkthrough-prompt>
                    <kbd className="flex size-6 items-center justify-center rounded-full bg-brass font-mono text-[11px] font-semibold text-ink">E</kbd>
                    {interaction.on ? copy.tvOff : copy.tvOn}
                  </div>
                )}
                {touch ? (
                  <>
                    <Joystick label={copy.stick} turned={turned} onMove={(x, y) => scene.current?.moveWalkthrough(x, y)} />
                    <p className="pointer-events-none absolute right-4 bottom-18 max-w-[45%] text-right text-[10px] leading-relaxed text-cream/70 [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">{copy.swipe}</p>
                    <button type="button" onClick={() => scene.current?.pauseWalkthrough()} className="absolute right-4 bottom-4 flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-ink/80 px-4 text-xs text-cream backdrop-blur-md">Ⅱ <span>{copy.pauseTouch}</span></button>
                  </>
                ) : <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                  <div className="rounded-xl border border-white/15 bg-ink/80 px-4 py-3 text-cream/85 backdrop-blur-md">
                    <p className="text-[11px]"><span className="font-mono tracking-[.18em] text-brass">W A S D</span><span className="mx-3 text-white/20">/</span>{copy.move}<span className="mx-3 text-white/20">/</span>{copy.look}</p>
                    <p className="mt-1.5 text-[10px] text-cream/50">{walkState === "drag" ? copy.dragLook : `ESC · ${copy.pause}`}</p>
                  </div>
                  <button type="button" onClick={() => scene.current?.pauseWalkthrough()} className="flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-ink/80 px-4 text-xs text-cream backdrop-blur-md">Ⅱ <span>Esc</span></button>
                </div>}
              </>
            )}
            {walking && (showNotice || !canWalk) && (
              <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-ink/70 p-6 backdrop-blur-md" data-walkthrough-notice role="region" aria-label={copy.experimental}>
                <div className="w-full max-w-lg border border-brass/30 bg-[#171a18]/95 p-7 shadow-2xl sm:p-10">
                  <div className="mb-6 flex size-12 items-center justify-center rounded-full border border-brass/40 text-brass"><ViewIcon view="walkthrough" /></div>
                  <p className="font-mono text-[10px] tracking-[.2em] text-brass uppercase">{copy.experimental}</p>
                  <h3 className="mt-4 font-display text-3xl text-cream sm:text-4xl">{copy.enterTitle}</h3>
                  <p className="mt-5 text-sm leading-relaxed text-cream/65">{copy.warning}</p>
                  <div className="my-7 space-y-3 border-y border-white/10 py-5 text-xs text-cream/70">
                    {touch ? <>
                      <p><span className="mr-4 text-brass">◎</span>{copy.stick}</p>
                      <p><span className="mr-4 text-brass">↔</span>{copy.swipe}</p>
                    </> : <>
                      <p><kbd className="mr-4 font-mono tracking-widest text-brass">W A S D</kbd>{copy.move}</p>
                      <p><span className="mr-4 text-brass">↔</span>{copy.look}</p>
                      <p><kbd className="mr-4 font-mono text-brass">ESC</kbd>{copy.pause}</p>
                    </>}
                  </div>
                  <p className="mb-3 flex items-center gap-2 text-[10px] text-cream/40" role="status"><span className={`size-1 rounded-full ${status === "ready" ? "bg-brass" : "animate-pulse bg-cream/40"}`} />{canWalk ? status === "ready" ? copy.ready : copy.preparing : copy.desktop}</p>
                  <button type="button" onClick={startWalking} disabled={status !== "ready" || !canWalk} className="flex min-h-12 w-full items-center justify-between bg-brass px-5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-40">{copy.start}<span aria-hidden>→</span></button>
                </div>
              </div>
            )}
            {walking && !showNotice && canWalk && (walkState === "paused" || walkState === "ready") && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/30 backdrop-blur-[2px]">
                <div className="border border-white/20 bg-ink/90 p-6 text-center shadow-xl">
                  <p className="mb-4 text-sm text-cream/75">{copy.paused}</p>
                  <button type="button" onClick={startWalking} className="min-h-12 bg-brass px-6 text-sm text-ink hover:bg-brass-bright">{copy.resume}</button>
                </div>
              </div>
            )}
          </div>
          {walkthroughAvailable && !canWalk && <p className="px-4 py-3 text-[10px] text-cream/50">{copy.desktop}</p>}
          {walking && status === "ready" && (
            <div className={`flex shrink-0 items-center gap-2 overflow-x-auto border-t border-white/10 bg-ink/70 px-4 ${immersive ? "py-1" : "py-2"}`} role="group" aria-label={copy.rooms}>
              <span className="mr-2 text-[10px] text-cream/40">{copy.rooms}</span>
              {model.viewpoints.map((viewpoint) => (
                <button type="button" key={viewpoint.id} onClick={() => {
                  if (!canWalk) return;
                  setRoom(viewpoint.id);
                  scene.current?.setView("walkthrough", viewpoint.id);
                  if (!showNotice) scene.current?.startWalkthrough({ touch });
                }} disabled={!canWalk} className="min-h-9 shrink-0 rounded-full border border-white/10 px-4 text-[11px] text-cream/70 hover:border-brass/50 hover:text-brass disabled:opacity-40">{copy[viewpoint.id]}</button>
              ))}
            </div>
          )}
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
