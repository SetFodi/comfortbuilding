import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ApartmentModel, PlanPoint } from "@/lib/apartment-model";
import { createGenericInterior } from "./apartment-generic-interior";
import { createParnavaz4650Interior } from "./parnavaz-4650-interior";
import { createWalkthroughControls, type WalkthroughPose, type WalkthroughState } from "./apartment-walkthrough-controls";
import { createApartmentPostprocessing } from "./apartment-postprocessing";
import { createTvChannel, type TvChannel } from "./apartment-tv";
import { createWalkthroughLayout } from "@/lib/apartment-walkthrough";

export type ApartmentView = "dollhouse" | "inside" | "top" | "walkthrough";

/** What the walkthrough crosshair is resting on, if it can be used. */
export type WalkthroughInteraction = { readonly kind: "tv"; readonly on: boolean } | null;

/** How close the visitor must be to reach for the TV. */
const TV_REACH = 3.6;

export interface ApartmentScene {
  setView: (view: ApartmentView, roomId?: string) => void;
  startWalkthrough: () => void;
  pauseWalkthrough: () => void;
  zoom: (direction: 1 | -1) => void;
  reset: () => void;
  dispose: () => void;
}

type Material = THREE.Material;

/** The furniture stays still, so one draw call per material is enough. */
function batchStaticMeshes(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const inverseGroup = group.matrixWorld.clone().invert();
  const batches = new Map<string, THREE.Mesh<THREE.BufferGeometry, Material>[]>();
  group.traverse((object) => {
    // TV screens stay separate so the walkthrough can switch them on.
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material) || object.material.transparent || object.userData.tv) return;
    const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
    const batch = batches.get(key) ?? [];
    batch.push(object as THREE.Mesh<THREE.BufferGeometry, Material>);
    batches.set(key, batch);
  });
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map((object) => {
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(inverseGroup.clone().multiply(object.matrixWorld));
      return geometry;
    });
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((item) => item.dispose());
    if (!geometry) continue;
    const merged = new THREE.Mesh(geometry, meshes[0].material);
    merged.castShadow = meshes[0].castShadow;
    merged.receiveShadow = meshes[0].receiveShadow;
    for (const object of meshes) {
      object.removeFromParent();
      object.geometry.dispose();
    }
    group.add(merged);
  }
}

function disposeScene(scene: THREE.Scene, extraMaterials: THREE.Material[] = []) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>(extraMaterials);
  const textures = new Set<THREE.Texture>();
  scene.traverse((object) => {
    if (object instanceof THREE.DirectionalLight || object instanceof THREE.PointLight || object instanceof THREE.SpotLight) {
      object.shadow.map?.dispose();
    }
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  materials.forEach((material) => {
    Object.values(material).forEach((value) => {
      if (value instanceof THREE.Texture) textures.add(value);
    });
    material.dispose();
  });
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
}

export function createApartmentScene(
  host: HTMLDivElement,
  model: ApartmentModel,
  onReady: () => void,
  onFailure: () => void,
  onWalkthroughState: (state: WalkthroughState) => void = () => {},
  onWalkthroughPose: (pose: WalkthroughPose) => void = () => {},
  onInteraction: (interaction: WalkthroughInteraction) => void = () => {},
): ApartmentScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  const scene = new THREE.Scene();
  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;outline:none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    return buildScene(renderer, scene, host, model, onReady, onFailure, onWalkthroughState, onWalkthroughPose, onInteraction);
  } catch (error) {
    disposeScene(scene);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    throw error;
  }
}

function buildScene(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  host: HTMLDivElement,
  model: ApartmentModel,
  onReady: () => void,
  onFailure: () => void,
  onWalkthroughState: (state: WalkthroughState) => void,
  onWalkthroughPose: (pose: WalkthroughPose) => void,
  onInteraction: (interaction: WalkthroughInteraction) => void,
): ApartmentScene {
  const camera = new THREE.PerspectiveCamera(39, 1, 0.05, 150);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.rotateSpeed = 0.7;
  controls.panSpeed = 0.55;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2.09;
  controls.minPolarAngle = 0.03;
  // Real metres measured on the architectural floor plan.
  const { width, depth } = model.size;
  const size = Math.max(width, depth);
  const point = ([x, y]: PlanPoint) => new THREE.Vector3((x - 0.5) * width, 0, (y - 0.5) * depth);
  const interior = model.id === "parnavaz-46-50"
    ? createParnavaz4650Interior(model, width, depth)
    : createGenericInterior(model, width, depth);
  const { structure, walls: cutaway, ceiling } = interior;
  const upper: THREE.Group = ("upper" in interior && interior.upper instanceof THREE.Group)
    ? interior.upper
    : new THREE.Group();
  ceiling.visible = false;
  scene.add(structure, cutaway, ceiling, upper);
  scene.updateMatrixWorld(true);

  // TV screens the walkthrough can switch on, each with a soft glow that is
  // only lit while it plays (in the walkthrough-only ceiling group).
  const tvs: { mesh: THREE.Mesh; idle: THREE.Material | THREE.Material[]; glow: THREE.PointLight; on: boolean }[] = [];
  for (const group of [structure, cutaway, upper]) {
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.userData.tv) return;
      const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()));
      const glow = new THREE.PointLight("#f1dfb8", 0, 3.2, 2);
      glow.position.copy(object.getWorldPosition(new THREE.Vector3())).addScaledVector(facing, 0.45);
      ceiling.add(glow);
      tvs.push({ mesh: object, idle: object.material, glow, on: false });
    });
  }
  let channel: TvChannel | null = null;
  let channelMaterial: THREE.MeshBasicMaterial | null = null;
  let aimed: (typeof tvs)[number] | null = null;
  const raycaster = new THREE.Raycaster();
  raycaster.far = TV_REACH;
  const screenCentre = new THREE.Vector2(0, 0);
  const wallLines = tvs.length ? createWalkthroughLayout(model).walls : [];
  cutaway.scale.y = 0.24;
  batchStaticMeshes(structure);
  batchStaticMeshes(cutaway);
  batchStaticMeshes(upper);

  const groundMaterial = new THREE.ShadowMaterial({ color: "#000000", opacity: 0.3 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(size * 5, size * 5), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.205;
  ground.receiveShadow = true;
  scene.add(ground);
  const ambient = new THREE.HemisphereLight("#fff4df", "#8b938a", 2.5);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight("#ffedcf", 3.2);
  sun.position.set(-width * 0.35, size * 1.5, -depth * 0.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -size;
  sun.shadow.camera.right = sun.shadow.camera.top = size;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = size * 4;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0002;
  sun.shadow.radius = 3;
  scene.add(sun);
  // Walkthrough sunlight comes in through the main glazing: balcony doors and
  // fixed glass first, otherwise windows. Each opening pulls by its length.
  const glazing = model.openings.filter((item) => item.kind === "balcony" || item.kind === "glazing");
  const centre = model.footprint.reduce((sum, corner) => sum.add(point(corner)), new THREE.Vector3())
    .divideScalar(Math.max(1, model.footprint.length));
  const outward = new THREE.Vector3();
  for (const item of glazing.length ? glazing : model.openings.filter(({ kind }) => kind === "window")) {
    const a = point(item.from);
    const b = point(item.to);
    const normal = new THREE.Vector3(-(b.z - a.z), 0, b.x - a.x);
    if (normal.dot(a.add(b).multiplyScalar(0.5).sub(centre)) < 0) normal.negate();
    outward.add(normal);
  }
  if (outward.lengthSq() < 1e-8) outward.set(0, 0, 1);
  outward.normalize();
  const across = new THREE.Vector3(outward.z, 0, -outward.x);
  const roomSun = outward.clone().multiplyScalar((Math.abs(outward.x) * width + Math.abs(outward.z) * depth) * 1.3)
    .addScaledVector(across, (Math.abs(outward.z) * width + Math.abs(outward.x) * depth) * 0.4)
    .setY(3.5);
  const fill = new THREE.DirectionalLight("#dce8ed", 1.3);
  fill.position.set(width, depth, depth);
  scene.add(fill);

  // Soft image-based light gives every surface believable reflections.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.35;

  // Allocate the screen-space effects only when the visitor enters the room.
  let postprocessing: ReturnType<typeof createApartmentPostprocessing> | undefined;

  let disposed = false;
  let ready = false;
  let frame = 0;
  let view: ApartmentView = "dollhouse";
  let selectedRoom = model.viewpoints[0]?.id;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let transition: {
    start: number;
    duration: number;
    from: THREE.Vector3;
    to: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    fromWall: number;
    toWall: number;
    fromFov: number;
    toFov: number;
  } | null = null;
  let visible = true;
  let previousFrameTime = 0;
  const walkthrough = createWalkthroughControls(
    camera, renderer.domElement, model, requestRender, onWalkthroughState, onWalkthroughPose,
  );

  function requestRender() {
    if (!disposed && !frame && !document.hidden && visible) frame = requestAnimationFrame(render);
  }

  function render(now: number) {
    frame = 0;
    if (disposed || document.hidden || !visible) return;
    const delta = previousFrameTime ? Math.min((now - previousFrameTime) / 1000, 0.05) : 1 / 60;
    previousFrameTime = now;
    if (transition) {
      renderer.shadowMap.needsUpdate = true;
      const elapsed = Math.min(1, (now - transition.start) / transition.duration);
      const t = elapsed < 0.5 ? 4 * elapsed ** 3 : 1 - (-2 * elapsed + 2) ** 3 / 2;
      camera.position.lerpVectors(transition.from, transition.to, t);
      controls.target.lerpVectors(transition.fromTarget, transition.toTarget, t);
      cutaway.scale.y = THREE.MathUtils.lerp(transition.fromWall, transition.toWall, t);
      camera.fov = THREE.MathUtils.lerp(transition.fromFov, transition.toFov, t);
      camera.updateProjectionMatrix();
      if (elapsed >= 1) {
        transition = null;
        controls.enabled = view !== "walkthrough";
      }
    }
    if (transition) camera.lookAt(controls.target);
    upper.visible = cutaway.scale.y > 0.6;
    const walking = view === "walkthrough" && walkthrough.update(delta);
    const changed = !transition && view !== "walkthrough" && controls.update();
    if (view === "walkthrough") aim();
    const playing = view === "walkthrough" && tvs.some((tv) => tv.on);
    if (playing) channel?.update(now);
    if (view === "walkthrough" && !transition && postprocessing) postprocessing.render(delta);
    else renderer.render(scene, camera);
    if (transition || changed || walking || playing) requestRender();
  }

  /** Finds the TV under the crosshair, if it is in reach and not behind a wall. */
  function aim() {
    let next: (typeof tvs)[number] | null = null;
    if (tvs.length && walkthrough.isActive()) {
      camera.updateMatrixWorld();
      raycaster.setFromCamera(screenCentre, camera);
      const [hit] = raycaster.intersectObjects(tvs.map((tv) => tv.mesh), false);
      if (hit && !wallBetween(camera.position, hit.point)) next = tvs.find((tv) => tv.mesh === hit.object) ?? null;
    }
    if (next === aimed) return;
    aimed = next;
    onInteraction(aimed ? { kind: "tv", on: aimed.on } : null);
  }

  function wallBetween(from: THREE.Vector3, to: THREE.Vector3) {
    // Stop short of the screen: its own wall sits a few centimetres behind it.
    const direction = new THREE.Vector2(to.x - from.x, to.z - from.z);
    const length = direction.length();
    if (length < 0.25) return false;
    direction.multiplyScalar((length - 0.2) / length);
    return wallLines.some(({ start, end }) => {
      const ex = end.x - start.x;
      const ez = end.z - start.z;
      const denominator = direction.x * ez - direction.y * ex;
      if (Math.abs(denominator) < 1e-9) return false;
      const sx = start.x - from.x;
      const sz = start.z - from.z;
      const t = (sx * ez - sz * ex) / denominator;
      const u = (sx * direction.y - sz * direction.x) / denominator;
      return t > 0 && t < 1 && u >= 0 && u <= 1;
    });
  }

  function switchTv(tv: (typeof tvs)[number], on: boolean) {
    if (tv.on === on) return;
    tv.on = on;
    if (on) {
      channel ??= createTvChannel();
      channelMaterial ??= new THREE.MeshBasicMaterial({ map: channel.texture, toneMapped: false });
      if (!tvs.some((other) => other !== tv && other.on)) channel.start(performance.now());
      tv.mesh.material = channelMaterial;
    } else tv.mesh.material = tv.idle;
    tv.glow.intensity = on ? 0.9 : 0;
    if (tv === aimed) onInteraction({ kind: "tv", on });
    requestRender();
  }

  function onKey(event: KeyboardEvent) {
    if (event.code !== "KeyE" || event.repeat || view !== "walkthrough" || !aimed || !walkthrough.isActive()) return;
    if (document.pointerLockElement !== renderer.domElement && document.activeElement !== renderer.domElement) return;
    event.preventDefault();
    switchTv(aimed, !aimed.on);
  }

  function fitDistance() {
    const verticalFov = THREE.MathUtils.degToRad(39);
    const limitingFov = camera.aspect < 1 ? 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect) : verticalFov;
    return size / (2 * Math.tan(limitingFov / 2)) * 1.15;
  }

  function interiorFov() {
    // About a 90° horizontal view, with a wider vertical view on narrow screens.
    return THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(1 / camera.aspect)), 64, 88);
  }

  function setView(nextView: ApartmentView, roomId?: string, instant = false) {
    walkthrough.leave();
    if (nextView !== "walkthrough") tvs.forEach((tv) => switchTv(tv, false));
    if (aimed) {
      aimed = null;
      onInteraction(null);
    }
    view = nextView;
    ceiling.visible = nextView === "walkthrough";
    const inRoom = nextView === "walkthrough";
    ambient.intensity = inRoom ? 0.4 : 2.5;
    sun.intensity = inRoom ? 2.2 : 3.2;
    scene.environmentIntensity = inRoom ? 0.42 : nextView === "inside" ? 0.5 : 0.35;
    // A neutral curve keeps the boards' linen and oak tones true to colour.
    renderer.toneMapping = inRoom ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = inRoom ? 0.88 : 1.15;
    const shadowSize = inRoom ? 4096 : 2048;
    if (sun.shadow.mapSize.x !== shadowSize) {
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
      sun.shadow.mapSize.set(shadowSize, shadowSize);
    }
    sun.shadow.radius = inRoom ? 5 : 3;
    // Centimetre-scale bias keeps daylight from leaking through wall/ceiling joins.
    sun.shadow.normalBias = inRoom ? 0.012 : 0.035;
    const shadowExtent = inRoom ? size * 0.72 : size;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -shadowExtent;
    sun.shadow.camera.right = sun.shadow.camera.top = shadowExtent;
    sun.shadow.camera.updateProjectionMatrix();
    if (inRoom) sun.position.copy(roomSun);
    else sun.position.set(-width * 0.35, size * 1.5, -depth * 0.8);
    fill.intensity = nextView === "walkthrough" ? 0.25 : 1.3;
    renderer.shadowMap.needsUpdate = true;
    scene.background = nextView === "walkthrough" ? new THREE.Color("#e7e1d5") : null;
    if (roomId) selectedRoom = roomId as typeof selectedRoom;
    if (nextView === "walkthrough") {
      if (!postprocessing) postprocessing = createApartmentPostprocessing(renderer, scene, camera);
      const rect = host.getBoundingClientRect();
      postprocessing.resize(rect.width, rect.height);
      transition = null;
      controls.enabled = false;
      cutaway.scale.y = 1;
      camera.fov = interiorFov();
      camera.updateProjectionMatrix();
      walkthrough.enter(selectedRoom);
      previousFrameTime = 0;
      requestRender();
      return;
    }
    const distance = fitDistance();
    let position: THREE.Vector3;
    let target: THREE.Vector3;
    if (nextView === "inside" && model.viewpoints.length > 0) {
      const room = model.viewpoints.find((item) => item.id === selectedRoom) ?? model.viewpoints[0];
      position = point(room.position);
      position.y = 1.58;
      target = point(room.target);
      target.y = 1.0;
      controls.minDistance = 0.35;
      controls.maxDistance = Math.max(5, size * 0.8);
      controls.minPolarAngle = 0.5;
      controls.maxPolarAngle = Math.PI / 2 + 0.16;
      controls.enablePan = false;
    } else {
      target = new THREE.Vector3(0, 0.3, 0);
      position = nextView === "top"
        ? new THREE.Vector3(0, distance, depth * 0.005)
        : new THREE.Vector3(width * 0.45, size * 0.9, depth * 0.9).normalize().multiplyScalar(distance);
      controls.minDistance = size * 0.55;
      controls.maxDistance = distance * 1.7;
      controls.minPolarAngle = 0.015;
      controls.maxPolarAngle = Math.PI / 2.09;
      controls.enablePan = true;
    }
    const wallHeight = nextView === "inside" ? 1 : nextView === "top" ? 0.06 : 0.24;
    const fov = nextView === "inside" ? interiorFov() : 39;
    if (instant || reducedMotion.matches) {
      transition = null;
      camera.position.copy(position);
      controls.target.copy(target);
      cutaway.scale.y = wallHeight;
      camera.fov = fov;
      camera.updateProjectionMatrix();
      controls.enabled = true;
    } else {
      controls.enabled = false;
      transition = {
        start: performance.now(), duration: nextView === "inside" ? 1150 : 900,
        from: camera.position.clone(), to: position,
        fromTarget: controls.target.clone(), toTarget: target,
        fromWall: cutaway.scale.y, toWall: wallHeight,
        fromFov: camera.fov, toFov: fov,
      };
    }
    requestRender();
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    camera.aspect = rect.width / rect.height;
    if (view === "inside" || view === "walkthrough") {
      if (transition) transition.toFov = interiorFov();
      else camera.fov = interiorFov();
    }
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
    postprocessing?.resize(rect.width, rect.height);
    if (ready && view !== "inside" && view !== "walkthrough") setView(view, undefined, true);
    requestRender();
  }

  function handleVisibility() {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestRender();
  }

  function contextLost(event: Event) {
    event.preventDefault();
    if (!disposed) onFailure();
  }

  controls.addEventListener("change", requestRender);
  document.addEventListener("keydown", onKey, true);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  document.addEventListener("visibilitychange", handleVisibility);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
  });
  intersectionObserver.observe(host);
  resize();
  setView("dollhouse", undefined, true);
  if (!reducedMotion.matches) {
    camera.position.multiplyScalar(1.13);
    camera.position.y += size * 0.08;
  }
  renderer.compileAsync(scene, camera).then(() => {
    if (disposed) return;
    ready = true;
    onReady();
    setView("dollhouse");
  }).catch(() => {
    if (!disposed) onFailure();
  });
  requestRender();

  return {
    setView,
    startWalkthrough() {
      if (view === "walkthrough" && ready && !disposed) walkthrough.start();
    },
    pauseWalkthrough: walkthrough.pause,
    zoom(direction) {
      if (disposed || view === "walkthrough") return;
      transition = null;
      controls.enabled = true;
      const offset = camera.position.clone().sub(controls.target);
      const distance = THREE.MathUtils.clamp(offset.length() * (direction === 1 ? 0.82 : 1.22), controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(offset.normalize().multiplyScalar(distance));
      requestRender();
    },
    reset() {
      setView(view, selectedRoom);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("keydown", onKey, true);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      controls.removeEventListener("change", requestRender);
      controls.dispose();
      walkthrough.dispose();
      disposeScene(scene, interior.materials);
      environment.dispose();
      postprocessing?.dispose();
      tvs.forEach((tv) => { tv.mesh.material = tv.idle; });
      channelMaterial?.dispose();
      channel?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
