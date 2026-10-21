"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PARNAVAZ_PLAN, planCentre, type FloorPlan } from "@/lib/parnavaz-floor-plans";

export interface FloorUnitView {
  readonly key: string;
  readonly number?: string;
  readonly available: boolean;
  readonly label: string;
}

interface Props {
  readonly plan: FloorPlan;
  readonly units: readonly FloorUnitView[];
  readonly hovered: string | null;
  readonly onHover: (key: string | null) => void;
  readonly onSelect: (key: string) => void;
  readonly label: string;
}

const WALL_HEIGHT = 2.2;
const BRASS = new THREE.Color("#c5aa72");
const SOLD = new THREE.Color("#8d8a82");
const INK = new THREE.Color("#22261f");

/** Plan pixels to metres, centred on the floor. */
const metres = ([x, y]: readonly [number, number]) => new THREE.Vector2(
  (x - PARNAVAZ_PLAN.width / 2) / PARNAVAZ_PLAN.pxPerMetre,
  (y - PARNAVAZ_PLAN.height / 2) / PARNAVAZ_PLAN.pxPerMetre,
);

/**
 * The floor in 3D: the cleaned drawing lies on the ground and every
 * apartment rises from it as a tinted volume with low cut walls, so a buyer
 * can turn the floor and see where each home sits around the cores.
 */
export default function ParnavazFloor3d({ plan, units, hovered, onHover, onSelect, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const api = useRef<{ highlight: (key: string | null) => void } | null>(null);
  const handlers = useRef({ onHover, onSelect });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    handlers.current = { onHover, onSelect };
  }, [onHover, onSelect]);

  useEffect(() => {
    const element = host.current;
    const labelLayer = labels.current;
    if (!element || !labelLayer) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;outline:none";
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 400);
    const width = PARNAVAZ_PLAN.width / PARNAVAZ_PLAN.pxPerMetre;
    const depth = PARNAVAZ_PLAN.height / PARNAVAZ_PLAN.pxPerMetre;
    // From the street side, a little to the left, looking down at the floor.
    const view = new THREE.Vector3(-0.12, 0.55, 0.83).normalize();
    const controls = new OrbitControls(camera, renderer.domElement);
    let turned = false;
    controls.addEventListener("start", () => { turned = true; });
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 10;
    controls.maxDistance = 160;
    controls.enablePan = false;

    scene.add(new THREE.HemisphereLight("#fff8ec", "#9c968a", 2.4));
    const sun = new THREE.DirectionalLight("#fff2dc", 1.6);
    sun.position.set(-20, 40, 30);
    scene.add(sun);

    const disposables: { dispose: () => void }[] = [];
    const texture = new THREE.TextureLoader().load(plan.image.src, () => render());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const groundGeometry = new THREE.PlaneGeometry(width, depth);
    const groundMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    disposables.push(texture, groundGeometry, groundMaterial);

    // A slab under the drawing gives the floor some body.
    const slabGeometry = new THREE.BoxGeometry(width * 1.02, 0.35, depth * 1.04);
    const slabMaterial = new THREE.MeshStandardMaterial({ color: "#2a2c2a", roughness: 0.9 });
    const slab = new THREE.Mesh(slabGeometry, slabMaterial);
    slab.position.y = -0.18;
    scene.add(slab);
    disposables.push(slabGeometry, slabMaterial);

    const pickable: THREE.Mesh[] = [];
    const pieces = new Map<string, { fill: THREE.MeshStandardMaterial; wall: THREE.MeshStandardMaterial; available: boolean; top: THREE.Vector3; label: HTMLElement | null }>();
    plan.units.forEach((unit, index) => {
      const view = units[index];
      if (!view) return;
      const outline = unit.points.map(metres);
      const shape = new THREE.Shape(outline.map((point) => new THREE.Vector2(point.x, -point.y)));
      const colour = view.available ? BRASS : SOLD;
      const fill = new THREE.MeshStandardMaterial({
        color: colour, transparent: true, opacity: view.available ? 0.34 : 0.22, roughness: 0.7, depthWrite: false, side: THREE.DoubleSide,
      });
      const fillGeometry = new THREE.ShapeGeometry(shape);
      const floor = new THREE.Mesh(fillGeometry, fill);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.03;
      floor.userData.key = view.key;
      scene.add(floor);
      pickable.push(floor);
      const wall = new THREE.MeshStandardMaterial({
        color: colour, transparent: true, opacity: view.available ? 0.62 : 0.4, roughness: 0.6, side: THREE.DoubleSide,
      });
      outline.forEach((from, edge) => {
        const to = outline[(edge + 1) % outline.length];
        const length = from.distanceTo(to);
        if (length < 0.05) return;
        const geometry = new THREE.BoxGeometry(length, WALL_HEIGHT, 0.12);
        const piece = new THREE.Mesh(geometry, wall);
        piece.position.set((from.x + to.x) / 2, WALL_HEIGHT / 2, (from.y + to.y) / 2);
        piece.rotation.y = -Math.atan2(to.y - from.y, to.x - from.x);
        piece.userData.key = view.key;
        scene.add(piece);
        pickable.push(piece);
        disposables.push(geometry);
      });
      disposables.push(fill, wall, fillGeometry);
      const [cx, cy] = planCentre(unit.points);
      const centre = metres([cx, cy]);
      const tag = labelLayer.querySelector<HTMLElement>(`[data-floor-3d-label="${view.key}"]`);
      pieces.set(view.key, { fill, wall, available: view.available, top: new THREE.Vector3(centre.x, WALL_HEIGHT + 0.4, centre.y), label: tag });
    });

    let active: string | null = null;
    function highlight(key: string | null) {
      active = key;
      for (const [itemKey, piece] of pieces) {
        const on = itemKey === key;
        piece.fill.opacity = on ? 0.55 : piece.available ? 0.34 : 0.22;
        piece.wall.opacity = on ? 0.95 : piece.available ? 0.62 : 0.4;
        piece.fill.color.copy(on ? INK : piece.available ? BRASS : SOLD);
        piece.wall.color.copy(on ? INK : piece.available ? BRASS : SOLD);
        piece.label?.toggleAttribute("data-active", on);
      }
      render();
    }

    const size = new THREE.Vector2();
    function placeLabels() {
      renderer.getSize(size);
      for (const piece of pieces.values()) {
        if (!piece.label) continue;
        const projected = piece.top.clone().project(camera);
        const visible = projected.z < 1;
        piece.label.style.transform = `translate(${(projected.x + 1) / 2 * size.x}px, ${(1 - projected.y) / 2 * size.y}px) translate(-50%, -100%)`;
        piece.label.style.opacity = visible ? "1" : "0";
      }
    }

    let frame = 0;
    function render() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const moving = controls.update();
        renderer.render(scene, camera);
        placeLabels();
        if (moving) render();
      });
    }
    controls.addEventListener("change", render);

    function resize() {
      const rect = element!.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.fov = 36;
      camera.updateProjectionMatrix();
      if (!turned) {
        // Step back until the whole floor fits across, however narrow the screen.
        const across = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect;
        const distance = Math.max(width * 0.52 / across, depth * 0.8 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), 22);
        camera.position.copy(view).multiplyScalar(Math.min(distance, controls.maxDistance));
        controls.update();
      }
      render();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    // Choosing an apartment flies down onto it before it opens, then the
    // floor quietly returns to its earlier view behind the apartment window.
    let flight = 0;
    function enter(key: string) {
      const piece = pieces.get(key);
      if (!piece || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        handlers.current.onSelect(key);
        return;
      }
      const fromPosition = camera.position.clone();
      const fromTarget = controls.target.clone();
      const toTarget = new THREE.Vector3(piece.top.x, 0, piece.top.z);
      const toPosition = toTarget.clone().add(new THREE.Vector3(0, 7.5, 4.2));
      const start = performance.now();
      controls.enabled = false;
      highlight(key);
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / 900);
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        camera.position.lerpVectors(fromPosition, toPosition, eased);
        controls.target.lerpVectors(fromTarget, toTarget, eased);
        camera.lookAt(controls.target);
        renderer.render(scene, camera);
        placeLabels();
        if (progress < 1) {
          flight = requestAnimationFrame(step);
          return;
        }
        handlers.current.onSelect(key);
        flight = window.setTimeout(() => {
          camera.position.copy(fromPosition);
          controls.target.copy(fromTarget);
          controls.enabled = true;
          render();
        }, 700) as unknown as number;
      };
      flight = requestAnimationFrame(step);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt: { x: number; y: number } | null = null;
    function pick(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return (raycaster.intersectObjects(pickable, false)[0]?.object.userData.key as string | undefined) ?? null;
    }
    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || event.buttons) return;
      const key = pick(event);
      if (key !== active) handlers.current.onHover(key);
      renderer.domElement.style.cursor = key && pieces.get(key)?.available ? "pointer" : "grab";
    }
    function onDown(event: PointerEvent) {
      downAt = { x: event.clientX, y: event.clientY };
    }
    function onUp(event: PointerEvent) {
      // A drag turns the floor; only a tap picks an apartment.
      if (!downAt || Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > 6) return;
      downAt = null;
      const key = pick(event);
      if (!key) return;
      if (event.pointerType !== "mouse" && key !== active) {
        handlers.current.onHover(key);
        return;
      }
      if (pieces.get(key)?.available) enter(key);
    }
    function onLeave() {
      handlers.current.onHover(null);
    }
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointerleave", onLeave);
    api.current = { highlight };

    return () => {
      api.current = null;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(flight);
      clearTimeout(flight);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [plan, units]);

  useEffect(() => {
    api.current?.highlight(hovered);
  }, [hovered, plan, units]);

  if (failed) return null;
  return (
    <div className="relative h-full w-full" role="img" aria-label={label} data-floor-3d>
      <div ref={host} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div ref={labels} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {units.map((unit) => (
          <div key={unit.key} data-floor-3d-label={unit.key}
            className={`absolute top-0 left-0 rounded-full px-2 py-0.5 font-mono text-[10px] whitespace-nowrap shadow-md transition-colors data-[active]:bg-brass-bright data-[active]:text-ink ${unit.available ? "bg-ink/85 text-brass" : "bg-ink/60 text-cream/55"}`}>
            {unit.label}
          </div>
        ))}
      </div>
    </div>
  );
}
