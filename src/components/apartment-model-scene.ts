import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ApartmentModel, PlanFurniture, PlanPoint } from "@/lib/apartment-model";

export type ApartmentView = "dollhouse" | "inside" | "top";

export interface ApartmentScene {
  setView: (view: ApartmentView, roomId?: string) => void;
  zoom: (direction: 1 | -1) => void;
  reset: () => void;
  dispose: () => void;
}

type Material = THREE.MeshStandardMaterial;
type Materials = ReturnType<typeof createMaterials>;

/** The furniture stays still, so one draw call per material is enough. */
function batchStaticMeshes(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const inverseGroup = group.matrixWorld.clone().invert();
  const batches = new Map<string, THREE.Mesh<THREE.BufferGeometry, Material>[]>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
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
    if (object instanceof THREE.DirectionalLight) object.shadow.map?.dispose();
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

function canvasTexture(kind: "oak" | "linen" | "stone"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  let seed = 1937;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  context.fillStyle = kind === "oak" ? "#b69a72" : kind === "linen" ? "#e0d8c8" : "#d3cbbd";
  context.fillRect(0, 0, 256, 256);
  for (let index = 0; index < 4200; index += 1) {
    context.fillStyle = `rgba(${random() > 0.45 ? "65,49,32" : "255,250,236"},${random() * 0.13})`;
    const x = random() * 256;
    const y = random() * 256;
    context.fillRect(x, y, kind === "oak" ? 1 : 0.65, kind === "oak" ? 15 + random() * 80 : 0.65);
  }
  if (kind === "oak") {
    context.strokeStyle = "rgba(57,42,26,.18)";
    context.lineWidth = 0.7;
    for (let index = 0; index < 8; index += 1) {
      context.beginPath();
      context.moveTo(index * 32, 0);
      context.lineTo(index * 32, 256);
      context.moveTo(index * 32, index % 2 === 0 ? 72 : 180);
      context.lineTo((index + 1) * 32, index % 2 === 0 ? 72 : 180);
      context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "oak" ? 0.45 : 2, kind === "oak" ? 0.45 : 2);
  return texture;
}

function createMaterials() {
  const oak = canvasTexture("oak");
  const linen = canvasTexture("linen");
  const stone = canvasTexture("stone");
  return {
    floor: new THREE.MeshStandardMaterial({ map: oak, color: "#dfc6a1", roughness: 0.88 }),
    wood: new THREE.MeshStandardMaterial({ map: oak, color: "#c3a17a", roughness: 0.72 }),
    darkWood: new THREE.MeshStandardMaterial({ color: "#69503b", roughness: 0.8 }),
    wall: new THREE.MeshStandardMaterial({ color: "#e9e2d5", roughness: 0.94 }),
    wallCap: new THREE.MeshStandardMaterial({ color: "#eee9df", roughness: 0.85 }),
    fabric: new THREE.MeshStandardMaterial({ map: linen, color: "#f3eee3", roughness: 1 }),
    sage: new THREE.MeshStandardMaterial({ map: linen, color: "#a3a38c", roughness: 1 }),
    pillow: new THREE.MeshStandardMaterial({ map: linen, color: "#eee9da", roughness: 1 }),
    rug: new THREE.MeshStandardMaterial({ map: linen, color: "#b9aa93", roughness: 1 }),
    stone: new THREE.MeshStandardMaterial({ map: stone, color: "#ede7d9", roughness: 0.68 }),
    ceramic: new THREE.MeshStandardMaterial({ color: "#f0eee5", roughness: 0.28 }),
    brass: new THREE.MeshStandardMaterial({ color: "#a88950", metalness: 0.72, roughness: 0.3 }),
    black: new THREE.MeshStandardMaterial({ color: "#2a2925", roughness: 0.45 }),
    leaf: new THREE.MeshStandardMaterial({ color: "#596748", roughness: 0.9 }),
    lightLeaf: new THREE.MeshStandardMaterial({ color: "#7c8760", roughness: 0.92 }),
    soil: new THREE.MeshStandardMaterial({ color: "#352e26", roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({
      color: "#b8d2cd", transparent: true, opacity: 0.18, roughness: 0.12,
      metalness: 0.08, depthWrite: false, side: THREE.DoubleSide,
    }),
    mirror: new THREE.MeshStandardMaterial({ color: "#a8b5ad", roughness: 0.08, metalness: 0.88 }),
  };
}

function mesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: Material,
  x: number,
  y: number,
  z: number,
) {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(x, y, z);
  result.castShadow = true;
  result.receiveShadow = true;
  parent.add(result);
  return result;
}

function box(
  parent: THREE.Object3D, width: number, height: number, depth: number,
  material: Material, x = 0, y = height / 2, z = 0, rounded = 0,
) {
  const geometry = rounded > 0
    ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(rounded, width / 3, height / 3, depth / 3))
    : new THREE.BoxGeometry(width, height, depth);
  return mesh(parent, geometry, material, x, y, z);
}

function cylinder(
  parent: THREE.Object3D, top: number, bottom: number, height: number,
  material: Material, x = 0, y = height / 2, z = 0,
) {
  return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, 24), material, x, y, z);
}

function plant(parent: THREE.Object3D, materials: Materials, radius: number, height: number, x = 0, z = 0, y = 0) {
  cylinder(parent, radius * 0.7, radius * 0.5, height * 0.24, materials.stone, x, y + height * 0.12, z);
  cylinder(parent, radius * 0.63, radius * 0.63, 0.018, materials.soil, x, y + height * 0.24, z);
  for (let index = 0; index < 9; index += 1) {
    const angle = index * 2.39996;
    const reach = radius * (0.5 + (index % 3) * 0.22);
    const stemHeight = height * (0.55 + (index % 4) * 0.11);
    const stem = cylinder(parent, 0.007, 0.009, stemHeight, materials.darkWood, x, y + height * 0.2 + stemHeight / 2, z);
    stem.rotation.z = Math.sin(angle) * 0.24;
    stem.rotation.x = Math.cos(angle) * 0.24;
    const leaf = mesh(
      parent, new THREE.SphereGeometry(1, 10, 6), index % 2 === 0 ? materials.leaf : materials.lightLeaf,
      x + Math.sin(angle) * reach, y + height * 0.23 + stemHeight, z + Math.cos(angle) * reach,
    );
    leaf.scale.set(radius * 0.23, height * 0.22, radius * 0.72);
    leaf.rotation.set(Math.cos(angle) * 0.7, angle, Math.sin(angle) * 0.7);
  }
}

function furniture(
  item: PlanFurniture, width: number, depth: number, materials: Materials,
): THREE.Group {
  const [left, top, planWidth, planDepth] = item.rect;
  const rotation = item.rotation ?? 0;
  const sideways = Math.abs(Math.sin(THREE.MathUtils.degToRad(rotation))) > 0.5;
  const w = (sideways ? planDepth * depth : planWidth * width);
  const d = (sideways ? planWidth * width : planDepth * depth);
  const group = new THREE.Group();
  group.position.set((left + planWidth / 2 - 0.5) * width, 0.05, (top + planDepth / 2 - 0.5) * depth);
  group.rotation.y = -THREE.MathUtils.degToRad(rotation);
  const leg = (x: number, z: number, height = 0.2) => cylinder(group, 0.025, 0.02, height, materials.darkWood, x, height / 2, z);
  const rug = (rw: number, rd: number) => box(group, rw, 0.025, rd, materials.rug, 0, 0.017, 0, 0.01);

  switch (item.kind) {
    case "bed": {
      rug(w * 1.13, d * 1.05);
      box(group, w, 0.23, d, materials.wood, 0, 0.2, 0, 0.035);
      box(group, w * 1.02, 1.02, 0.085, materials.wood, 0, 0.51, -d / 2 + 0.03, 0.025);
      box(group, w * 0.96, 0.24, d * 0.96, materials.fabric, 0, 0.43, 0, 0.08);
      box(group, w * 0.98, 0.09, d * 0.67, materials.fabric, 0, 0.58, d * 0.14, 0.035);
      box(group, w * 1.005, 0.04, d * 0.29, materials.sage, 0, 0.64, d * 0.31, 0.017);
      for (const side of [-1, 1]) {
        const pillow = box(group, w * 0.4, 0.14, d * 0.2, materials.pillow, side * w * 0.24, 0.63, -d * 0.33, 0.065);
        pillow.rotation.y = side * 0.04;
      }
      break;
    }
    case "sofa": {
      box(group, w, 0.3, d, materials.fabric, 0, 0.3, 0, 0.08);
      box(group, w, 0.61, d * 0.2, materials.fabric, 0, 0.62, -d * 0.4, 0.065);
      for (const side of [-1, 1]) {
        box(group, w * 0.105, 0.42, d, materials.fabric, side * w * 0.45, 0.47, 0, 0.055);
        const cushion = box(group, w * 0.23, 0.12, d * 0.48, materials.sage, side * w * 0.28, 0.7, -d * 0.15, 0.05);
        cushion.rotation.x = 0.85;
        cushion.rotation.z = side * 0.18;
        leg(side * w * 0.4, -d * 0.38, 0.16);
        leg(side * w * 0.4, d * 0.38, 0.16);
      }
      const seats = w > 1.5 ? 3 : 2;
      for (let seat = 0; seat < seats; seat += 1) {
        box(group, w * 0.78 / seats - 0.02, 0.13, d * 0.73, materials.pillow,
          (seat - (seats - 1) / 2) * w * 0.78 / seats, 0.49, d * 0.09, 0.045);
      }
      break;
    }
    case "table": {
      rug(w * 1.8, d * 1.8);
      const tableTop = cylinder(group, 0.5, 0.5, 0.07, materials.wood, 0, 0.46, 0);
      tableTop.scale.set(w, 1, d);
      cylinder(group, Math.min(w, d) * 0.18, Math.min(w, d) * 0.23, 0.4, materials.wood, 0, 0.22, 0);
      plant(group, materials, Math.min(w, d) * 0.13, 0.33, -w * 0.18, -d * 0.12, 0.5);
      box(group, w * 0.23, 0.025, d * 0.29, materials.pillow, w * 0.18, 0.51, d * 0.14);
      cylinder(group, 0.055, 0.045, 0.07, materials.ceramic, w * 0.18, 0.56, d * 0.14);
      break;
    }
    case "chair": {
      cylinder(group, w * 0.4, w * 0.34, 0.13, materials.fabric, 0, 0.43, 0).scale.z = d / w;
      box(group, w * 0.85, 0.4, 0.08, materials.wood, 0, 0.67, -d * 0.38, 0.03);
      for (const x of [-1, 1]) for (const z of [-1, 1]) leg(x * w * 0.29, z * d * 0.29, 0.4);
      break;
    }
    case "kitchen": {
      box(group, w, 0.84, d, materials.wood, 0, 0.44, 0, 0.012);
      box(group, w * 1.015, 0.065, d * 1.04, materials.stone, 0, 0.89, 0, 0.012);
      const doors = Math.max(1, Math.round(w / 0.5));
      for (let door = 0; door < doors; door += 1) {
        const x = (door - (doors - 1) / 2) * w / doors;
        box(group, w / doors - 0.018, 0.72, 0.018, materials.wood, x, 0.47, d / 2 + 0.012);
        box(group, Math.min(0.15, w / doors * 0.5), 0.012, 0.025, materials.brass, x, 0.76, d / 2 + 0.03);
      }
      if (w > 1.4) {
        box(group, Math.min(0.5, w * 0.24), 0.02, d * 0.76, materials.black, w * 0.26, 0.936, 0, 0.02);
        for (const x of [-0.11, 0.11]) for (const z of [-d * 0.18, d * 0.18]) {
          mesh(group, new THREE.TorusGeometry(0.065, 0.004, 5, 18), materials.brass, w * 0.26 + x, 0.95, z).rotation.x = -Math.PI / 2;
        }
        box(group, w * 0.2, 0.025, d * 0.62, materials.mirror, -w * 0.26, 0.935, 0, 0.025);
        cylinder(group, 0.012, 0.012, 0.25, materials.brass, -w * 0.26, 1.05, -d * 0.32);
        box(group, 0.012, 0.012, 0.15, materials.brass, -w * 0.26, 1.17, -d * 0.22);
      } else {
        plant(group, materials, 0.1, 0.36, 0, 0, 0.93);
      }
      break;
    }
    case "wardrobe": {
      box(group, w, 1.85, d, materials.wood, 0, 0.93, 0, 0.015);
      const count = Math.max(2, Math.round(w / 0.52));
      for (let index = 0; index < count; index += 1) {
        const x = (index - (count - 1) / 2) * w / count;
        box(group, w / count - 0.013, 1.77, 0.018, materials.wood, x, 0.94, d / 2 + 0.012);
        box(group, 0.012, 0.2, 0.025, materials.brass, x + w / count * 0.3, 0.95, d / 2 + 0.03);
      }
      break;
    }
    case "shower": {
      box(group, w, 0.075, d, materials.stone, 0, 0.04, 0, 0.02);
      box(group, w, 1.9, 0.012, materials.glass, 0, 0.99, d / 2);
      box(group, 0.012, 1.9, d, materials.glass, w / 2, 0.99, 0);
      cylinder(group, 0.012, 0.012, 1.45, materials.brass, -w * 0.28, 1.05, -d * 0.4);
      cylinder(group, 0.1, 0.1, 0.025, materials.brass, -w * 0.28, 1.78, -d * 0.25);
      cylinder(group, 0.025, 0.025, 0.008, materials.black, 0, 0.083, 0);
      break;
    }
    case "bathtub": {
      box(group, w, 0.48, d, materials.ceramic, 0, 0.25, 0, 0.1);
      box(group, w * 0.72, 0.022, d * 0.8, materials.stone, 0, 0.493, 0, 0.01);
      box(group, w * 0.62, 0.025, d * 0.67, materials.ceramic, 0, 0.51, 0, 0.012);
      cylinder(group, 0.013, 0.013, 0.16, materials.brass, 0, 0.58, -d * 0.41);
      box(group, 0.025, 0.018, d * 0.16, materials.brass, 0, 0.66, -d * 0.34);
      box(group, w * 0.97, 0.035, d * 0.14, materials.wood, 0, 0.55, d * 0.16, 0.012);
      cylinder(group, 0.045, 0.04, 0.08, materials.ceramic, w * 0.22, 0.61, d * 0.16);
      break;
    }
    case "toilet": {
      const bowl = mesh(group, new THREE.SphereGeometry(0.5, 20, 12), materials.ceramic, 0, 0.29, d * 0.1);
      bowl.scale.set(w * 0.85, 0.5, d * 0.8);
      box(group, w * 0.7, 0.63, d * 0.26, materials.ceramic, 0, 0.34, -d * 0.34, 0.05);
      const lid = cylinder(group, 0.5, 0.5, 0.045, materials.ceramic, 0, 0.47, d * 0.1);
      lid.scale.set(w * 0.87, 1, d * 0.76);
      box(group, 0.08, 0.008, 0.035, materials.brass, 0, 0.66, -d * 0.34);
      break;
    }
    case "vanity": {
      box(group, w, 0.62, d, materials.wood, 0, 0.46, 0, 0.015);
      box(group, w, 0.045, d, materials.stone, 0, 0.8, 0, 0.012);
      const basin = cylinder(group, Math.min(w, d) * 0.39, Math.min(w, d) * 0.28, 0.12, materials.ceramic, 0, 0.88, 0);
      basin.scale.x = 1.15;
      cylinder(group, 0.012, 0.012, 0.21, materials.brass, 0, 0.92, -d * 0.38);
      const mirror = cylinder(group, w * 0.38, w * 0.38, 0.025, materials.mirror, 0, 1.43, -d / 2);
      mirror.rotation.x = Math.PI / 2;
      break;
    }
    case "plant":
      plant(group, materials, Math.min(w, d) * 0.48, Math.min(1.6, Math.max(w, d) * 2.3));
      break;
  }
  return group;
}

export function createApartmentScene(
  host: HTMLDivElement,
  model: ApartmentModel,
  onReady: () => void,
  onFailure: () => void,
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
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;outline:none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    return buildScene(renderer, scene, host, model, onReady, onFailure);
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
  const materials = createMaterials();
  const aspect = model.source.crop[2] / model.source.crop[3];
  const width = Math.sqrt(model.area * aspect);
  const depth = width / aspect;
  const size = Math.max(width, depth);
  const point = ([x, y]: PlanPoint) => new THREE.Vector3((x - 0.5) * width, 0, (y - 0.5) * depth);
  const structure = new THREE.Group();
  const cutaway = new THREE.Group();
  scene.add(structure, cutaway);
  const shape = new THREE.Shape();
  model.footprint.forEach((coordinate, index) => {
    const position = point(coordinate);
    if (index === 0) shape.moveTo(position.x, -position.z);
    else shape.lineTo(position.x, -position.z);
  });
  shape.closePath();
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.04;
  floor.receiveShadow = true;
  structure.add(floor);
  const slab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false }),
    materials.wallCap,
  );
  slab.rotation.x = -Math.PI / 2;
  slab.position.y = -0.17;
  slab.receiveShadow = slab.castShadow = true;
  structure.add(slab);

  for (const [from, to] of model.walls) {
    const a = point(from);
    const b = point(to);
    const length = a.distanceTo(b);
    const wall = box(cutaway, length, 2.65, 0.115, materials.wall);
    wall.position.set((a.x + b.x) / 2, 1.365, (a.z + b.z) / 2);
    wall.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    const cap = box(cutaway, length + 0.012, 0.035, 0.127, materials.wallCap);
    cap.position.set(wall.position.x, 2.707, wall.position.z);
    cap.rotation.y = wall.rotation.y;
    const skirting = box(structure, length, 0.08, 0.125, materials.wallCap);
    skirting.position.set(wall.position.x, 0.085, wall.position.z);
    skirting.rotation.y = wall.rotation.y;
  }
  cutaway.scale.y = 0.24;
  model.furniture.forEach((item) => structure.add(furniture(item, width, depth, materials)));
  batchStaticMeshes(structure);
  batchStaticMeshes(cutaway);

  const groundMaterial = new THREE.ShadowMaterial({ color: "#000000", opacity: 0.3 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(size * 5, size * 5), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.205;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(new THREE.HemisphereLight("#fff4df", "#8b938a", 2.5));
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
  const fill = new THREE.DirectionalLight("#dce8ed", 1.3);
  fill.position.set(width, depth, depth);
  scene.add(fill);

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

  function requestRender() {
    if (!disposed && !frame && !document.hidden && visible) frame = requestAnimationFrame(render);
  }

  function render(now: number) {
    frame = 0;
    if (disposed || document.hidden || !visible) return;
    if (transition) {
      const elapsed = Math.min(1, (now - transition.start) / transition.duration);
      const t = elapsed < 0.5 ? 4 * elapsed ** 3 : 1 - (-2 * elapsed + 2) ** 3 / 2;
      camera.position.lerpVectors(transition.from, transition.to, t);
      controls.target.lerpVectors(transition.fromTarget, transition.toTarget, t);
      cutaway.scale.y = THREE.MathUtils.lerp(transition.fromWall, transition.toWall, t);
      camera.fov = THREE.MathUtils.lerp(transition.fromFov, transition.toFov, t);
      camera.updateProjectionMatrix();
      if (elapsed >= 1) {
        transition = null;
        controls.enabled = true;
      }
    }
    if (transition) camera.lookAt(controls.target);
    const changed = !transition && controls.update();
    renderer.render(scene, camera);
    if (transition || changed) requestRender();
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
    view = nextView;
    if (roomId) selectedRoom = roomId as typeof selectedRoom;
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
    if (view === "inside") {
      if (transition) transition.toFov = interiorFov();
      else camera.fov = interiorFov();
    }
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
    if (ready && view !== "inside") setView(view, undefined, true);
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
    zoom(direction) {
      if (disposed) return;
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
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      controls.removeEventListener("change", requestRender);
      controls.dispose();
      disposeScene(scene, Object.values(materials));
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
