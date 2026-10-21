import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type {
  ApartmentModel,
  PlanFurniture,
  PlanOpening,
  PlanPoint,
} from "@/lib/apartment-model";
import { applyMetricUVs, daylightTexture, textureMaps } from "./apartment-surfaces";

/**
 * Builds a furnished apartment from a calibrated board trace: walls with
 * real door frames, glazing and window sills, finished floors, balcony
 * railings and furniture in the boards' Japandi palette. Dimensions follow
 * the architectural plan; furniture and finishes stay illustrative.
 */
export interface Interior {
  structure: THREE.Group;
  walls: THREE.Group;
  ceiling: THREE.Group;
  /** Wall-hung pieces, hidden while the walls are cut down for overview. */
  upper?: THREE.Group;
  materials: THREE.Material[];
}

type Surface = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial;

const WALL_HEIGHT = 2.65;
const DOOR_HEAD = 2.1;
const GLAZING_HEAD = 2.35;
const WINDOW_SILL = 0.85;
const WINDOW_HEAD = 2.25;
const EXTERIOR_WALL = 0.22;
const INTERIOR_WALL = 0.12;

function createMaterials() {
  const floorOak = textureMaps("floorOak");
  const oak = textureMaps("oak");
  const linen = textureMaps("linen");
  const plaster = textureMaps("plaster");
  const stone = textureMaps("stone");
  const rug = textureMaps("rug");
  const metal = textureMaps("metal");
  const tile = textureMaps("tile");
  const standard = (properties: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(properties);
  const physical = (properties: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(properties);
  const metric = <T extends THREE.Material>(material: T, u: number, v = u) => {
    material.userData.textureMetres = [u, v];
    return material;
  };
  // Woven fabrics catch light at grazing angles; sheen gives them that softness.
  const fabric = (color: string, sheenColor: string, bumpScale = 0.00065) => metric(physical({
    color, ...linen, bumpScale, roughness: 0.96,
    sheen: 0.55, sheenRoughness: 0.85, sheenColor,
  }), 0.16);
  return {
    // Oiled oak boards with a faint satin finish that reflects the windows.
    floor: metric(physical({
      color: "#f3eee7", ...floorOak, bumpScale: 0.0016, roughness: 0.62,
      clearcoat: 0.16, clearcoatRoughness: 0.44,
    }), 1.2, 2.4),
    oak: metric(physical({ color: "#f0e9df", ...oak, bumpScale: 0.00065, roughness: 0.61, clearcoat: 0.1, clearcoatRoughness: 0.5 }), 0.45, 1.8),
    paleOak: metric(physical({ color: "#fff9ed", ...oak, bumpScale: 0.0005, roughness: 0.67, clearcoat: 0.08, clearcoatRoughness: 0.55 }), 0.45, 1.8),
    darkOak: metric(physical({ color: "#8e7b61", ...oak, bumpScale: 0.0005, roughness: 0.64, clearcoat: 0.08, clearcoatRoughness: 0.5 }), 0.45, 1.8),
    wall: metric(standard({ color: "#ede6da", ...plaster, bumpScale: 0.0004, roughness: 0.98, envMapIntensity: 0.6 }), 0.8),
    wallCap: standard({ color: "#f3ede3", roughness: 0.88 }),
    // Lit mostly from below in the overview, so a little self-light keeps it pale.
    ceiling: metric(standard({
      color: "#f1ebe1", ...plaster, bumpScale: 0.0003, emissive: "#6b655b", emissiveIntensity: 0.32, roughness: 0.97,
    }), 0.8),
    linen: fabric("#f1eadc", "#fffaf0"),
    cream: fabric("#f7f0e4", "#fffdf6", 0.00045),
    sage: fabric("#a5a48b", "#d6d8c2", 0.0007),
    tan: fabric("#b7a58c", "#e6d8c2"),
    blush: fabric("#d8c3b3", "#f4e6da"),
    rug: metric(physical({
      color: "#c7b79d", ...rug, bumpScale: 0.0016, roughness: 1,
      sheen: 0.45, sheenRoughness: 0.9, sheenColor: "#f0e4cf", envMapIntensity: 0.4,
    }), 0.26),
    // Honed stone: smooth enough to pick up soft highlights.
    stone: metric(physical({ color: "#f1e9df", ...stone, bumpScale: 0.00045, roughness: 0.56, clearcoat: 0.18, clearcoatRoughness: 0.4 }), 0.8),
    // 30 cm bathroom tiles and 60 cm outdoor porcelain share one grout map.
    tile: metric(physical({ color: "#e2d9cd", ...tile, bumpScale: 0.0005, roughness: 0.5, clearcoat: 0.24, clearcoatRoughness: 0.32 }), 1.2),
    balcony: metric(standard({ color: "#d6cdbf", ...tile, bumpScale: 0.0006, roughness: 0.82 }), 2.4),
    ceramic: physical({ color: "#f7f1e8", roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06 }),
    brass: metric(standard({ color: "#b89a69", ...metal, bumpScale: 0.00012, metalness: 0.95, roughness: 0.32 }), 0.18),
    black: physical({ color: "#272722", roughness: 0.32, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
    screen: physical({ color: "#111718", metalness: 0.1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }),
    steel: metric(standard({ color: "#c6c7c1", ...metal, bumpScale: 0.00012, metalness: 0.95, roughness: 0.29 }), 0.18),
    frame: physical({ color: "#3b3c39", metalness: 0.6, roughness: 0.38, clearcoat: 0.2, clearcoatRoughness: 0.4 }),
    leaf: physical({ color: "#65714c", roughness: 0.62, sheen: 0.4, sheenColor: "#a9b78a", side: THREE.DoubleSide }),
    lightLeaf: physical({ color: "#85906b", roughness: 0.66, sheen: 0.4, sheenColor: "#c4cfa4", side: THREE.DoubleSide }),
    soil: standard({ color: "#44392d", roughness: 1 }),
    warmLight: standard({ color: "#fff1d8", emissive: "#ffe5bc", emissiveIntensity: 1.1, roughness: 1 }),
    artPaper: standard({ color: "#dfd4c2", roughness: 1 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#e4ece8", transparent: true, opacity: 0.12, roughness: 0.03, ior: 1.5,
      metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6,
      depthWrite: false, side: THREE.DoubleSide,
    }),
    sheer: metric(standard({
      color: "#fff5e1", ...linen, bumpScale: 0.00025, transparent: true, opacity: 0.46,
      side: THREE.DoubleSide, roughness: 1, depthWrite: false,
    }), 0.16),
    mirror: standard({ color: "#d7dcd4", metalness: 1, roughness: 0.03, envMapIntensity: 1.4 }),
    daylight: new THREE.MeshBasicMaterial({ map: daylightTexture(), side: THREE.DoubleSide }),
  };
}

type Materials = ReturnType<typeof createMaterials>;

function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: Surface, x = 0, y = 0, z = 0) {
  applyMetricUVs(geometry, material);
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.castShadow = !material.transparent;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function box(
  parent: THREE.Object3D, width: number, height: number, depth: number,
  material: Surface, x = 0, y = height / 2, z = 0, rounded = 0,
) {
  const radius = Math.min(rounded, width / 2.2, height / 2.2, depth / 2.2);
  const geometry = radius > 0.002
    ? new RoundedBoxGeometry(width, height, depth, 2, radius)
    : new THREE.BoxGeometry(width, height, depth);
  return mesh(parent, geometry, material, x, y, z);
}

function cylinder(
  parent: THREE.Object3D, top: number, bottom: number, height: number,
  material: Surface, x = 0, y = height / 2, z = 0, segments = 24,
) {
  return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, segments), material, x, y, z);
}

function plant(parent: THREE.Object3D, m: Materials, radius: number, height: number, x = 0, z = 0, y = 0) {
  cylinder(parent, radius * 0.62, radius * 0.46, height * 0.24, m.stone, x, y + height * 0.12, z);
  cylinder(parent, radius * 0.56, radius * 0.56, 0.015, m.soil, x, y + height * 0.243, z);
  for (let index = 0; index < 11; index += 1) {
    const angle = index * 2.39996;
    const reach = radius * (0.35 + (index % 4) * 0.2);
    const stemHeight = height * (0.45 + (index % 5) * 0.11);
    const stem = cylinder(parent, 0.006, 0.008, stemHeight, m.darkOak, x, y + height * 0.22 + stemHeight / 2, z, 6);
    stem.rotation.z = Math.sin(angle) * 0.28;
    stem.rotation.x = Math.cos(angle) * 0.28;
    const blade = mesh(
      parent, new THREE.SphereGeometry(1, 10, 6), index % 2 ? m.leaf : m.lightLeaf,
      x + Math.sin(angle) * reach, y + height * 0.24 + stemHeight, z + Math.cos(angle) * reach,
    );
    blade.scale.set(radius * 0.2, height * 0.2, radius * 0.62);
    blade.rotation.set(Math.cos(angle) * 0.7, angle, Math.sin(angle) * 0.7);
  }
}

function tableLamp(parent: THREE.Object3D, m: Materials, x: number, y: number, z: number) {
  cylinder(parent, 0.06, 0.08, 0.12, m.ceramic, x, y + 0.06, z);
  cylinder(parent, 0.01, 0.01, 0.13, m.brass, x, y + 0.18, z, 8);
  cylinder(parent, 0.1, 0.13, 0.18, m.linen, x, y + 0.31, z);
  cylinder(parent, 0.115, 0.115, 0.005, m.warmLight, x, y + 0.22, z);
}

function vase(parent: THREE.Object3D, m: Materials, x: number, y: number, z: number, scale = 1) {
  const body = mesh(parent, new THREE.SphereGeometry(0.06 * scale, 18, 12), m.ceramic, x, y + 0.06 * scale, z);
  body.scale.y = 1.25;
  cylinder(parent, 0.022 * scale, 0.035 * scale, 0.06 * scale, m.ceramic, x, y + 0.15 * scale, z, 12);
  for (let index = 0; index < 5; index += 1) {
    const angle = index * 1.3;
    const twig = cylinder(parent, 0.003, 0.004, 0.24 * scale, m.darkOak, x, y + 0.29 * scale, z, 5);
    twig.rotation.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35);
    const sprig = mesh(parent, new THREE.SphereGeometry(0.03 * scale, 8, 6), m.lightLeaf,
      x + Math.sin(angle) * 0.07 * scale, y + 0.4 * scale, z + Math.cos(angle) * 0.07 * scale);
    sprig.scale.set(0.6, 1.4, 0.6);
  }
}

function books(parent: THREE.Object3D, m: Materials, x: number, y: number, z: number, width = 0.2) {
  box(parent, width, 0.025, width * 0.7, m.cream, x, y + 0.0125, z);
  box(parent, width * 0.86, 0.022, width * 0.62, m.sage, x, y + 0.036, z);
}

/** A duvet that drapes over the mattress edges, with a few soft folds. */
function duvet(parent: THREE.Object3D, m: Materials, width: number, depth: number, top: number) {
  const geometry = new THREE.PlaneGeometry(width, depth, 32, 32);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = -positions.getY(index);
    const edge = Math.pow(Math.abs(x / (width / 2)), 7);
    const folds = Math.sin(z * 19 + x * 9) * 0.008 + Math.sin(z * 8 - x * 14) * 0.01;
    positions.setXYZ(index, x, top - edge * 0.13 + folds, z);
  }
  geometry.computeVertexNormals();
  return mesh(parent, geometry, m.cream);
}

/** Pleated fabric hanging from its top edge at the origin. */
function curtain(parent: THREE.Object3D, m: Materials, w: number, h: number, sheer: boolean) {
  const geometry = new THREE.PlaneGeometry(w, h, Math.max(16, Math.round(w * 140)), 12);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const wave = Math.sin((x / w + 0.5) * Math.PI * Math.max(4, Math.round(w * 36))) * (sheer ? 0.028 : 0.05);
    positions.setZ(index, wave * (0.65 + (h / 2 - y) / h * 0.35));
  }
  geometry.computeVertexNormals();
  const hanger = new THREE.Group();
  parent.add(hanger);
  mesh(hanger, geometry, sheer ? m.sheer : m.linen, 0, -h / 2).castShadow = !sheer;
  return hanger;
}

/** A framed botanical line print, facing local +z. */
function framedArt(parent: THREE.Object3D, m: Materials, width: number, height: number) {
  box(parent, width, height, 0.035, m.darkOak, 0, 0, 0, 0.004);
  box(parent, width - 0.06, height - 0.06, 0.008, m.artPaper, 0, 0, 0.02);
  for (let branch = 0; branch < 5; branch += 1) {
    const reach = (branch - 2) * width * 0.09;
    const stalk = box(parent, 0.004, height * (0.36 + branch % 3 * 0.08), 0.003, m.darkOak, reach * 0.5, -height * 0.05, 0.026);
    stalk.rotation.z = -reach * 1.4;
    const leaf = mesh(parent, new THREE.SphereGeometry(1, 10, 6), m.sage, reach, height * (0.14 + branch % 3 * 0.05), 0.027);
    leaf.scale.set(width * 0.05, height * 0.1, 0.003);
    leaf.rotation.z = branch * 0.31 - 0.6;
  }
}

/** Woven oak pendant with its own warm light, hanging to `height`. */
function pendant(parent: THREE.Object3D, m: Materials, x: number, z: number, height: number, radius: number) {
  cylinder(parent, 0.006, 0.006, WALL_HEIGHT - height, m.darkOak, x, (WALL_HEIGHT + height) / 2 + 0.04, z, 6);
  mesh(parent, new THREE.SphereGeometry(radius, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), m.oak, x, height, z);
  cylinder(parent, radius * 0.9, radius * 0.9, 0.012, m.warmLight, x, height - 0.015, z, 32).castShadow = false;
  for (let weave = 0; weave < 9; weave += 1) {
    const fraction = (weave + 1) / 10;
    const ring = mesh(parent, new THREE.TorusGeometry(radius * Math.sin(fraction * Math.PI / 2), 0.0035, 5, 48),
      m.darkOak, x, height + radius * Math.cos(fraction * Math.PI / 2), z);
    ring.rotation.x = Math.PI / 2;
  }
}

function furniture(
  item: PlanFurniture, width: number, depth: number, m: Materials, upperParent: THREE.Group,
  options: {
    /** Metres from the piece's back edge to the wall face behind it, if any. */
    wallGap?: number | null;
    /** An L-shaped kitchen keeps its sink on the main run and hob on the return. */
    kitchen?: "full" | "sink" | "hob";
    /** Local x ends (-1 left, +1 right) where another sofa piece joins. */
    joined?: readonly (-1 | 1)[];
    /** Where a media unit's TV hangs: local x centre, width and the local z of the face behind it. */
    screen?: { readonly x: number; readonly width: number; readonly mount: number } | null;
    /** Width of clear wall behind the middle of a bed or sofa, for its art. */
    artRoom?: number;
  } = {},
): THREE.Group {
  const { wallGap = null, kitchen = "full", joined = [], screen = null, artRoom = Infinity } = options;
  const [left, top, planWidth, planDepth] = item.rect;
  const rotation = item.rotation ?? 0;
  const sideways = Math.abs(Math.sin(THREE.MathUtils.degToRad(rotation))) > 0.5;
  const w = sideways ? planDepth * depth : planWidth * width;
  const d = sideways ? planWidth * width : planDepth * depth;
  const group = new THREE.Group();
  group.position.set((left + planWidth / 2 - 0.5) * width, 0.05, (top + planDepth / 2 - 0.5) * depth);
  group.rotation.y = -THREE.MathUtils.degToRad(rotation);
  // Same placement, but shown only when the walls are full height.
  const upper = new THREE.Group();
  upper.position.copy(group.position);
  upper.rotation.copy(group.rotation);
  upperParent.add(upper);
  const leg = (x: number, z: number, height: number, radius = 0.022) =>
    cylinder(group, radius, radius * 0.8, height, m.darkOak, x, height / 2, z, 10);

  switch (item.kind) {
    case "bed": {
      box(group, w, 0.24, d, m.oak, 0, 0.17, 0, 0.03);
      box(group, w * 1.02, 0.95, 0.09, m.tan, 0, 0.6, -d / 2 + 0.045, 0.04);
      box(group, w * 1.04, 0.08, 0.11, m.oak, 0, 1.1, -d / 2 + 0.05, 0.02);
      box(group, w * 0.95, 0.22, d * 0.95, m.cream, 0, 0.4, 0.015, 0.07);
      duvet(group, m, w * 1.03, d * 0.72, 0.56).position.z = d * 0.13;
      box(group, w * 0.99, 0.2, 0.05, m.cream, 0, 0.43, d * 0.49, 0.02);
      box(group, w * 1.005, 0.04, d * 0.22, m.sage, 0, 0.575, d * 0.3, 0.016);
      if (wallGap !== null && artRoom >= 0.5) {
        const art = new THREE.Group();
        art.position.set(0, 1.62, -d / 2 - wallGap + 0.02);
        framedArt(art, m, Math.min(1.0, w * 0.6, artRoom - 0.1), 0.6);
        upper.add(art);
      }
      for (const side of [-1, 1]) {
        const pillow = box(group, w * 0.4, 0.15, d * 0.17, m.cream, side * w * 0.23, 0.6, -d * 0.36, 0.07);
        pillow.rotation.x = -0.25;
      }
      box(group, w * 0.34, 0.12, d * 0.08, m.sage, 0, 0.6, -d * 0.24, 0.05).rotation.x = -0.2;
      break;
    }
    case "sofa": {
      box(group, w, 0.26, d, m.linen, 0, 0.28, 0, 0.08);
      box(group, w * 0.98, 0.5, d * 0.22, m.linen, 0, 0.6, -d * 0.39, 0.08);
      for (const side of [-1, 1]) {
        // No armrest where another sofa piece continues the corner.
        if (!joined.includes(side as -1 | 1)) {
          box(group, Math.min(0.2, w * 0.1), 0.38, d, m.linen, side * (w / 2 - Math.min(0.1, w * 0.05)), 0.44, 0, 0.07);
        }
        leg(side * w * 0.42, -d * 0.36, 0.15, 0.018);
        leg(side * w * 0.42, d * 0.36, 0.15, 0.018);
        const cushion = box(group, Math.min(0.48, w * 0.22), 0.4, 0.12, side > 0 ? m.sage : m.tan,
          side * w * 0.28, 0.66, -d * 0.24, 0.05);
        cushion.rotation.x = -0.3;
      }
      const seats = w > 1.7 ? 3 : 2;
      const seatWidth = (w - 0.4) / seats;
      for (let seat = 0; seat < seats; seat += 1) {
        box(group, seatWidth - 0.02, 0.13, d * 0.66, m.cream,
          (seat - (seats - 1) / 2) * seatWidth, 0.47, d * 0.1, 0.05);
      }
      if (wallGap !== null && artRoom >= 0.5) {
        const art = new THREE.Group();
        art.position.set(0, 1.5, -d / 2 - wallGap + 0.02);
        framedArt(art, m, Math.min(1.1, w * 0.5, artRoom - 0.1), 0.75);
        upper.add(art);
      }
      // A throw folded over the seat and draped down its front edge.
      box(group, seatWidth * 0.62, 0.018, d * 0.45, m.tan, -w * 0.28, 0.545, d * 0.16, 0.008);
      box(group, seatWidth * 0.62, 0.22, 0.018, m.tan, -w * 0.28, 0.44, d * 0.44, 0.008);
      break;
    }
    case "table": {
      // Round and oval tables stand on a pedestal, rectangular ones on two slabs.
      if (item.shape === "round") {
        const tableTop = cylinder(group, 0.5, 0.5, 0.05, m.oak, 0, 0.4, 0, 40);
        tableTop.scale.set(w, 1, d);
        cylinder(group, Math.min(w, d) * 0.22, Math.min(w, d) * 0.28, 0.36, m.oak, 0, 0.2, 0);
      } else {
        box(group, w, 0.05, d, m.oak, 0, 0.4, 0, 0.015);
        const long = d >= w;
        for (const end of [-1, 1]) {
          box(group, long ? w * 0.8 : 0.06, 0.36, long ? 0.06 : d * 0.8, m.oak,
            long ? 0 : end * w * 0.36, 0.2, long ? end * d * 0.36 : 0, 0.02);
        }
      }
      vase(group, m, -w * 0.12, 0.425, -d * 0.12, 0.8);
      books(group, m, w * 0.14, 0.425, d * 0.16, Math.min(0.22, Math.min(w, d) * 0.5));
      break;
    }
    case "dining": {
      const round = item.shape === "round";
      if (round) {
        const tableTop = cylinder(group, 0.5, 0.5, 0.045, m.oak, 0, 0.74, 0, 48);
        tableTop.scale.set(w, 1, d);
        cylinder(group, 0.07, 0.09, 0.7, m.oak, 0, 0.36, 0);
        cylinder(group, Math.min(w, d) * 0.22, Math.min(w, d) * 0.24, 0.03, m.oak, 0, 0.015, 0);
      } else {
        box(group, w, 0.045, d, m.oak, 0, 0.74, 0, 0.012);
        for (const x of [-1, 1]) for (const z of [-1, 1]) {
          box(group, 0.05, 0.7, 0.05, m.oak, x * (w / 2 - 0.07), 0.36, z * (d / 2 - 0.07), 0.01);
        }
      }
      vase(group, m, 0, 0.765, 0, 1.1);
      break;
    }
    case "chair": {
      for (const x of [-1, 1]) for (const z of [-1, 1]) leg(x * w * 0.36, z * d * 0.34, 0.44, 0.016);
      box(group, w * 0.92, 0.07, d * 0.88, m.linen, 0, 0.47, 0, 0.03);
      box(group, w * 0.86, 0.36, 0.035, m.oak, 0, 0.7, -d * 0.42, 0.012);
      break;
    }
    case "armchair": {
      for (const x of [-1, 1]) for (const z of [-1, 1]) leg(x * w * 0.38, z * d * 0.36, 0.22, 0.02);
      box(group, w * 0.9, 0.1, d * 0.85, m.oak, 0, 0.26, 0, 0.02);
      box(group, w * 0.8, 0.12, d * 0.72, m.blush, 0, 0.36, d * 0.04, 0.05);
      const back = box(group, w * 0.8, 0.42, 0.12, m.blush, 0, 0.6, -d * 0.34, 0.05);
      back.rotation.x = -0.18;
      for (const side of [-1, 1]) box(group, 0.06, 0.24, d * 0.8, m.oak, side * w * 0.44, 0.4, 0, 0.02);
      break;
    }
    case "sideTable": {
      const radius = Math.min(w, d) / 2;
      cylinder(group, radius, radius, 0.035, m.oak, 0, 0.5, 0, 32);
      cylinder(group, radius * 0.18, radius * 0.24, 0.48, m.oak, 0, 0.24, 0, 12);
      plant(group, m, radius * 0.5, 0.3, 0, 0, 0.52);
      break;
    }
    case "nightstand": {
      if (item.shape === "round") {
        const radius = Math.min(w, d) / 2;
        cylinder(group, radius, radius, 0.035, m.oak, 0, 0.5, 0, 32);
        cylinder(group, radius * 0.92, radius * 0.92, 0.44, m.oak, 0, 0.26, 0, 32);
        tableLamp(group, m, 0, 0.52, 0);
        break;
      }
      box(group, w, 0.46, d, m.oak, 0, 0.27, 0, 0.015);
      box(group, w * 0.9, 0.16, 0.012, m.paleOak, 0, 0.36, d / 2 + 0.006);
      box(group, w * 0.3, 0.012, 0.02, m.brass, 0, 0.36, d / 2 + 0.016);
      tableLamp(group, m, 0, 0.5, -d * 0.05);
      break;
    }
    case "kitchen": {
      box(group, w, 0.1, d - 0.05, m.darkOak, 0, 0.05, -0.025);
      box(group, w, 0.76, d, m.paleOak, 0, 0.48, 0, 0.01);
      box(group, w + 0.02, 0.04, d + 0.03, m.stone, 0, 0.88, 0.005, 0.008);
      const doors = Math.max(1, Math.round(w / 0.6));
      for (let door = 0; door < doors; door += 1) {
        const x = (door - (doors - 1) / 2) * w / doors;
        box(group, w / doors - 0.012, 0.7, 0.018, m.paleOak, x, 0.47, d / 2 + 0.01, 0.004);
        box(group, Math.min(0.2, w / doors * 0.45), 0.012, 0.02, m.darkOak, x, 0.8, d / 2 + 0.024);
      }
      if (w > 1.1) {
        // Hob and oven, sink and tap, then upper cabinets with a light strip.
        const hobAt = item.fittings ? item.fittings.hob : kitchen === "sink" ? null : kitchen === "hob" ? 0 : -0.28;
        const sinkAt = item.fittings ? item.fittings.sink : kitchen === "hob" ? null : kitchen === "sink" ? 0 : 0.16;
        const hobX = (hobAt ?? 0) * w;
        const sinkX = (sinkAt ?? 0) * w;
        if (hobAt !== null) {
          box(group, 0.58, 0.012, Math.min(0.5, d * 0.8), m.black, hobX, 0.906, 0, 0.012);
          for (const x of [-0.13, 0.13]) for (const z of [-0.11, 0.11]) {
            const ring = mesh(group, new THREE.TorusGeometry(0.07, 0.005, 6, 24), m.steel, hobX + x, 0.915, z);
            ring.rotation.x = Math.PI / 2;
          }
          box(group, 0.56, 0.48, 0.02, m.black, hobX, 0.5, d / 2 + 0.016, 0.006);
          box(group, 0.46, 0.25, 0.006, m.screen, hobX, 0.48, d / 2 + 0.028);
        }
        if (sinkAt !== null) {
          box(group, 0.5, 0.015, Math.min(0.4, d * 0.7), m.steel, sinkX, 0.9, 0, 0.02);
          box(group, 0.42, 0.02, Math.min(0.34, d * 0.6), m.stone, sinkX, 0.89, 0, 0.02);
          cylinder(group, 0.012, 0.012, 0.3, m.brass, sinkX, 1.05, -d * 0.36, 10);
          const spout = mesh(group, new THREE.TorusGeometry(0.08, 0.011, 8, 18, Math.PI), m.brass, sinkX, 1.2, -d * 0.24);
          spout.rotation.y = Math.PI / 2;
        }
        box(upper, w, 0.68, Math.min(0.36, d * 0.6), m.paleOak, 0, 1.86, -d / 2 + Math.min(0.18, d * 0.3), 0.01);
        for (let door = 1; door < doors; door += 1) {
          box(upper, 0.008, 0.64, 0.01, m.darkOak, -w / 2 + door * w / doors, 1.86, -d / 2 + Math.min(0.36, d * 0.6) + 0.005);
        }
        box(upper, w * 0.94, 0.012, 0.02, m.warmLight, 0, 1.5, -d / 2 + Math.min(0.34, d * 0.58));
        box(upper, w, 0.6, 0.012, m.stone, 0, 1.2, -d / 2 + 0.006);
      }
      plant(group, m, 0.07, 0.3, w * 0.38, -d * 0.18, 0.9);
      break;
    }
    case "fridge": {
      box(group, w, 2.02, d, m.paleOak, 0, 1.03, 0, 0.012);
      box(group, w * 0.96, 0.012, 0.02, m.darkOak, 0, 1.28, d / 2 + 0.006);
      box(group, 0.018, 0.5, 0.03, m.brass, -w * 0.38, 1.0, d / 2 + 0.02, 0.006);
      box(group, 0.018, 0.3, 0.03, m.brass, -w * 0.38, 1.55, d / 2 + 0.02, 0.006);
      break;
    }
    case "wardrobe": {
      box(group, w, 0.08, d - 0.04, m.darkOak, 0, 0.04, -0.02);
      box(group, w, 2.2, d, m.paleOak, 0, 1.18, 0, 0.012);
      const count = Math.max(2, Math.round(w / 0.5));
      for (let index = 0; index < count; index += 1) {
        const x = (index - (count - 1) / 2) * w / count;
        box(group, w / count - 0.01, 2.1, 0.018, m.paleOak, x, 1.18, d / 2 + 0.01, 0.004);
        box(group, 0.014, 0.42, 0.025, m.darkOak, x + (index % 2 ? -1 : 1) * w / count * 0.4, 1.12, d / 2 + 0.025);
      }
      break;
    }
    case "media": {
      // A shallow trace still gets a usable unit, grown forward from its wall.
      const unit = Math.max(0.3, d);
      const front = -d / 2 + unit;
      box(group, w, 0.42, unit, m.oak, 0, 0.29, front - unit / 2, 0.012);
      const panels = Math.max(2, Math.round(w / 0.45));
      for (let panel = 0; panel < panels; panel += 1) {
        box(group, w / panels - 0.01, 0.34, 0.012, m.paleOak, (panel - (panels - 1) / 2) * w / panels, 0.29, front + 0.006);
      }
      const { x: screenX, width: screenWidth, mount } = screen ?? { x: 0, width: Math.min(1.45, w * 0.7), mount: -d / 2 };
      box(upper, screenWidth, screenWidth * 0.58, 0.035, m.black, screenX, 1.28, mount + 0.03, 0.008);
      // The walkthrough can switch this screen on.
      box(upper, screenWidth * 0.97, screenWidth * 0.55, 0.006, m.screen, screenX, 1.28, mount + 0.05).userData.tv = true;
      const shelf = (Math.max(mount, -d / 2) + front) / 2;
      vase(group, m, w * 0.4, 0.5, shelf, 0.7);
      books(group, m, -w * 0.38, 0.5, shelf, 0.16);
      break;
    }
    case "console": {
      box(group, w, 0.78, d, m.oak, 0, 0.44, 0, 0.012);
      box(group, w + 0.02, 0.035, d + 0.02, m.stone, 0, 0.84, 0, 0.008);
      const drawers = Math.max(1, Math.round(w / 0.55));
      for (let drawer = 0; drawer < drawers; drawer += 1) {
        box(group, w / drawers - 0.012, 0.6, 0.012, m.paleOak, (drawer - (drawers - 1) / 2) * w / drawers, 0.46, d / 2 + 0.006);
      }
      plant(group, m, Math.min(0.12, w * 0.15), 0.42, w * 0.3, 0, 0.86);
      if (w > 0.7) tableLamp(group, m, -w * 0.3, 0.86, 0);
      break;
    }
    case "shelving": {
      const shelf = Math.max(0.14, d);
      const middle = -d / 2 + shelf / 2;
      box(group, w, 1.3, 0.025, m.paleOak, 0, 0.75, -d / 2 + 0.0125);
      for (const y of [0.62, 1.05, 1.4]) box(group, w, 0.025, shelf, m.oak, 0, y, middle);
      for (const side of [-1, 1]) box(group, 0.025, 1.3, shelf, m.oak, side * w / 2, 0.75, middle);
      for (let slot = 0; slot < Math.floor(w / 0.6); slot += 1) {
        const x = -w / 2 + 0.3 + slot * 0.6;
        if (slot % 2) vase(group, m, x, 1.065, middle, 0.55);
        else books(group, m, x, 1.4125, middle, 0.14);
      }
      break;
    }
    case "rug": {
      if (item.shape === "round") {
        const mat = cylinder(group, 0.5, 0.5, 0.014, m.rug, 0, 0.007, 0, 64);
        mat.scale.set(w, 1, d);
      } else box(group, w, 0.014, d, m.rug, 0, 0.007, 0, 0.006);
      break;
    }
    case "ledge": {
      // Boxed-in cistern: tiled box with a stone top and a flush plate.
      box(group, w, 1.0, d, m.tile, 0, 0.5, 0, 0.006);
      box(group, w + 0.02, 0.03, d + 0.02, m.stone, 0, 1.015, 0, 0.006);
      box(group, Math.min(0.24, w * 0.5), 0.16, 0.012, m.steel, 0, 0.82, d / 2 + 0.006, 0.004);
      break;
    }
    case "shower": {
      if (item.shape === "round") {
        // Quarter-round enclosure in the back-right corner, curving to the front.
        const radius = Math.min(w, d);
        const corner = new THREE.Vector3(w / 2, 0, -d / 2);
        const tray = mesh(group, new THREE.CylinderGeometry(radius, radius, 0.06, 40, 1, false, -Math.PI / 2, Math.PI / 2),
          m.stone, corner.x, 0.03, corner.z);
        tray.receiveShadow = true;
        mesh(group, new THREE.CylinderGeometry(radius - 0.02, radius - 0.02, 1.9, 40, 1, true, -Math.PI / 2, Math.PI / 2),
          m.glass, corner.x, 1.01, corner.z);
        const rail = mesh(group, new THREE.TorusGeometry(radius - 0.02, 0.01, 6, 40, Math.PI / 2), m.steel, corner.x, 1.96, corner.z);
        rail.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        cylinder(upper, 0.011, 0.011, 1.5, m.black, w / 2 - 0.06, 1.0, -d / 2 + radius * 0.45, 8);
        cylinder(upper, 0.11, 0.11, 0.02, m.black, w / 2 - radius * 0.3, 2.02, -d / 2 + radius * 0.3);
        cylinder(group, 0.03, 0.03, 0.006, m.black, w / 2 - radius * 0.35, 0.064, -d / 2 + radius * 0.35);
        break;
      }
      box(group, w, 0.06, d, m.stone, 0, 0.03, 0, 0.012);
      box(group, w, 1.95, 0.01, m.glass, 0, 1.0, d / 2);
      box(group, 0.01, 1.95, d, m.glass, w / 2, 1.0, 0);
      box(group, w, 0.02, 0.02, m.steel, 0, 1.98, d / 2);
      cylinder(upper, 0.011, 0.011, 1.5, m.black, -w * 0.3, 1.0, -d / 2 + 0.06, 8);
      cylinder(upper, 0.11, 0.11, 0.02, m.black, -w * 0.3, 2.02, -d / 2 + 0.16);
      cylinder(group, 0.03, 0.03, 0.006, m.black, 0, 0.064, 0);
      break;
    }
    case "bathtub": {
      box(group, w, 0.52, d, m.ceramic, 0, 0.27, 0, 0.09);
      box(group, w * 0.86, 0.05, d * 0.8, m.stone, 0, 0.5, 0, 0.04);
      cylinder(group, 0.012, 0.012, 0.18, m.black, 0, 0.62, -d * 0.43, 8);
      box(group, 0.025, 0.016, 0.14, m.black, 0, 0.7, -d * 0.38);
      box(group, w * 0.98, 0.03, 0.18, m.oak, 0, 0.56, d * 0.25, 0.01);
      cylinder(group, 0.04, 0.035, 0.08, m.ceramic, w * 0.25, 0.615, d * 0.25, 12);
      break;
    }
    case "toilet": {
      const bowl = mesh(group, new THREE.SphereGeometry(0.5, 22, 14), m.ceramic, 0, 0.3, d * 0.1);
      bowl.scale.set(w * 0.82, 0.45, d * 0.78);
      box(group, w * 0.74, 0.42, d * 0.24, m.ceramic, 0, 0.62, -d * 0.36, 0.05);
      const lid = cylinder(group, 0.5, 0.5, 0.04, m.ceramic, 0, 0.46, d * 0.1);
      lid.scale.set(w * 0.84, 1, d * 0.74);
      box(group, 0.1, 0.008, 0.04, m.black, 0, 0.84, -d * 0.36);
      break;
    }
    case "vanity": {
      box(group, w, 0.48, d, m.oak, 0, 0.5, 0, 0.012);
      box(group, w + 0.02, 0.035, d + 0.02, m.stone, 0, 0.76, 0, 0.008);
      const basin = cylinder(group, Math.min(w, d) * 0.38, Math.min(w, d) * 0.28, 0.13, m.ceramic, 0, 0.84, d * 0.05, 32);
      basin.scale.x = 1.1;
      cylinder(group, 0.011, 0.011, 0.24, m.black, 0, 0.9, -d * 0.4, 8);
      const mirror = cylinder(upper, Math.min(0.32, w * 0.42), Math.min(0.32, w * 0.42), 0.02, m.mirror, 0, 1.45, -d / 2 + 0.012, 40);
      mirror.rotation.x = Math.PI / 2;
      box(upper, 0.04, 0.32, 0.04, m.warmLight, Math.min(0.42, w * 0.5), 1.45, -d / 2 + 0.03, 0.01);
      break;
    }
    case "plant":
      plant(group, m, Math.min(w, d) * 0.46, Math.min(1.5, Math.max(0.7, Math.max(w, d) * 2.2)));
      break;
  }
  return group;
}

function frameGroup(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  const group = new THREE.Group();
  group.position.set((a.x + b.x) / 2, 0.05, (a.z + b.z) / 2);
  group.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
  parent.add(group);
  return group;
}

/** Fills a wall gap: a door with its frame and open leaf, glazing or a window. */
function opening(
  parent: THREE.Object3D, item: PlanOpening, a: THREE.Vector3, b: THREE.Vector3,
  thickness: number, inside: 1 | -1, m: Materials,
  /** Clear wall beside the `a` and `b` ends on the room side, for the drapes. */
  room: readonly [number, number] = [0.3, 0.3],
) {
  const length = a.distanceTo(b);
  const group = frameGroup(parent, a, b);
  const head = item.kind === "balcony" || item.kind === "glazing" ? GLAZING_HEAD
    : item.kind === "window" ? WINDOW_HEAD : DOOR_HEAD;
  box(group, length, WALL_HEIGHT - head, thickness, m.wall, 0, head + (WALL_HEIGHT - head) / 2);

  if (item.kind === "door" || item.kind === "entrance") {
    const entrance = item.kind === "entrance";
    const trim = entrance ? 0.06 : 0.045;
    for (const side of [-1, 1]) box(group, trim, head, thickness + 0.03, m.oak, side * (length / 2 - trim / 2), head / 2);
    box(group, length, trim, thickness + 0.03, m.oak, 0, head - trim / 2);
    // A pair of leaves is hung one at each jamb and meets in the middle.
    const hinges = item.leaves === 2 ? [-1, 1] : [item.hinge === "to" ? 1 : -1];
    const leafWidth = (length - trim * 2 - 0.01) / hinges.length;
    const angle = THREE.MathUtils.degToRad(entrance ? 28 : hinges.length === 2 ? 60 : 78);
    for (const hingeSign of hinges) {
      const pivot = new THREE.Group();
      pivot.position.set(hingeSign * (length / 2 - trim), 0, 0);
      // A leaf pointing along -hingeSign turns towards local +z for a positive rotation of hingeSign.
      pivot.rotation.y = hingeSign * (item.swing ?? 1) * angle;
      group.add(pivot);
      const leaf = box(pivot, leafWidth, head - trim - 0.01, entrance ? 0.06 : 0.04, entrance ? m.darkOak : m.paleOak,
        -hingeSign * leafWidth / 2, (head - trim) / 2);
      leaf.castShadow = true;
      const handleX = -hingeSign * (leafWidth - 0.08);
      for (const face of [-1, 1]) box(pivot, 0.12, 0.018, 0.022, m.brass, handleX, 1.02, face * (entrance ? 0.045 : 0.035));
    }
    return;
  }

  if (item.kind === "window") {
    box(group, length, WINDOW_SILL, thickness, m.wall, 0, WINDOW_SILL / 2);
    box(group, length + 0.06, 0.03, thickness + 0.08, m.stone, 0, WINDOW_SILL + 0.015, 0.02);
  }
  const bottom = item.kind === "window" ? WINDOW_SILL + 0.03 : 0.02;
  const height = head - bottom;
  // Outer frame.
  for (const side of [-1, 1]) box(group, 0.05, height, 0.07, m.frame, side * (length / 2 - 0.025), bottom + height / 2);
  box(group, length, 0.05, 0.07, m.frame, 0, head - 0.025);
  box(group, length, 0.05, 0.07, m.frame, 0, bottom + 0.025);

  if (item.kind === "balcony") {
    // Glazed doors: one leaf, or a pair meeting in the middle, each with its
    // own stiles, rails and handle.
    const leaves = length > 1.1 ? 2 : 1;
    const leafWidth = (length - 0.1) / leaves;
    for (let leaf = 0; leaf < leaves; leaf += 1) {
      const cx = -length / 2 + 0.05 + leafWidth * (leaf + 0.5);
      for (const side of [-1, 1]) box(group, 0.055, height - 0.1, 0.05, m.frame, cx + side * (leafWidth / 2 - 0.0275), bottom + height / 2);
      box(group, leafWidth, 0.06, 0.05, m.frame, cx, head - 0.08);
      box(group, leafWidth, 0.11, 0.05, m.frame, cx, bottom + 0.105);
      box(group, leafWidth - 0.1, height - 0.27, 0.012, m.glass, cx, bottom + 0.16 + (height - 0.27) / 2);
      const meeting = leaves === 2 ? (leaf === 0 ? 1 : -1) : 1;
      for (const face of [-1, 1]) {
        box(group, 0.02, 0.16, 0.025, m.brass, cx + meeting * (leafWidth / 2 - 0.07), 1.05, face * 0.045, 0.006);
      }
    }
    // Linen drapes stacked at each side, with sheers just inside the glass.
    // They stack on clear wall beside the opening, or over the glass edge
    // where a column or a piece of furniture stands right beside it.
    const [before, after] = room.map((clear) => Math.min(0.15, clear));
    const rod = cylinder(group, 0.012, 0.012, length + before + after, m.brass, (after - before) / 2, head + 0.08, inside * (thickness / 2 + 0.15), 10);
    rod.rotation.z = Math.PI / 2;
    const drapeWidth = Math.min(0.36, length * 0.22);
    for (const side of [-1, 1]) {
      const drape = curtain(group, m, drapeWidth, head + 0.04, false);
      const outer = length / 2 + Math.min(0.24, room[side < 0 ? 0 : 1]);
      drape.position.set(side * (outer - drapeWidth / 2), head + 0.06, inside * (thickness / 2 + 0.15));
      const sheer = curtain(group, m, length * 0.24, head + 0.02, true);
      sheer.position.set(side * length * 0.32, head + 0.05, inside * (thickness / 2 + 0.09));
    }
    return;
  }
  // Fixed glass and windows: panes about a metre wide between slim mullions.
  const panes = Math.max(1, Math.round(length / (item.kind === "glazing" ? 1.1 : 0.75)));
  for (let pane = 1; pane < panes; pane += 1) {
    box(group, 0.04, height, 0.06, m.frame, -length / 2 + pane * length / panes, bottom + height / 2);
  }
  box(group, length - 0.08, height - 0.08, 0.012, m.glass, 0, bottom + height / 2);
}

function sameLine(
  [a, b]: readonly [PlanPoint, PlanPoint],
  [c, d]: readonly [PlanPoint, PlanPoint],
  tolerance: number,
): boolean {
  const horizontal = Math.abs(a[1] - b[1]) < tolerance && Math.abs(c[1] - d[1]) < tolerance;
  const vertical = Math.abs(a[0] - b[0]) < tolerance && Math.abs(c[0] - d[0]) < tolerance;
  if (horizontal && Math.abs(a[1] - c[1]) < tolerance) {
    const overlap = Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0])) - Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0]));
    return overlap > Math.abs(c[0] - d[0]) * 0.5;
  }
  if (vertical && Math.abs(a[0] - c[0]) < tolerance) {
    const overlap = Math.min(Math.max(a[1], b[1]), Math.max(c[1], d[1])) - Math.max(Math.min(a[1], b[1]), Math.min(c[1], d[1]));
    return overlap > Math.abs(c[1] - d[1]) * 0.5;
  }
  return false;
}

export function createGenericInterior(model: ApartmentModel, width: number, depth: number): Interior {
  const structure = new THREE.Group();
  const walls = new THREE.Group();
  const ceiling = new THREE.Group();
  const upper = new THREE.Group();
  upper.visible = false;
  structure.name = `${model.id}-interior`;
  walls.name = `${model.id}-walls`;
  const m = createMaterials();
  const point = ([x, y]: PlanPoint) => new THREE.Vector3((x - 0.5) * width, 0, (y - 0.5) * depth);

  const shape = new THREE.Shape();
  model.footprint.forEach((coordinate, index) => {
    const position = point(coordinate);
    if (index === 0) shape.moveTo(position.x, -position.z);
    else shape.lineTo(position.x, -position.z);
  });
  shape.closePath();
  const floorGeometry = new THREE.ShapeGeometry(shape);
  applyMetricUVs(floorGeometry, m.floor);
  const floor = new THREE.Mesh(floorGeometry, m.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.04;
  floor.receiveShadow = true;
  structure.add(floor);
  const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false }), m.wallCap);
  slab.rotation.x = -Math.PI / 2;
  slab.position.y = -0.17;
  slab.receiveShadow = slab.castShadow = true;
  structure.add(slab);

  for (const area of model.floors) {
    const [left, top, w, d] = area.rect;
    box(structure, w * width, 0.012, d * depth, area.kind === "tile" ? m.tile : m.balcony,
      (left + w / 2 - 0.5) * width, 0.047, (top + d / 2 - 0.5) * depth);
  }

  // Walls on the outline are the building's thicker shell.
  const onOutline = ([x, y]: PlanPoint) => model.footprint.some((corner, index) => {
    const next = model.footprint[(index + 1) % model.footprint.length];
    const dx = next[0] - corner[0];
    const dy = next[1] - corner[1];
    const t = Math.max(0, Math.min(1, ((x - corner[0]) * dx + (y - corner[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - corner[0] - t * dx, y - corner[1] - t * dy) < 0.012;
  });
  const thicknessOf = (from: PlanPoint, to: PlanPoint) => onOutline(from) && onOutline(to) ? EXTERIOR_WALL : INTERIOR_WALL;
  for (const [from, to] of model.walls) {
    const a = point(from);
    const b = point(to);
    const length = a.distanceTo(b);
    if (length < 0.02) continue;
    const thickness = thicknessOf(from, to);
    const group = frameGroup(walls, a, b);
    group.position.y = 0;
    box(group, length + thickness * 0.5, WALL_HEIGHT, thickness, m.wall, 0, WALL_HEIGHT / 2 + 0.04);
    box(group, length + thickness * 0.5 + 0.01, 0.03, thickness + 0.012, m.wallCap, 0, WALL_HEIGHT + 0.055);
    const skirting = frameGroup(structure, a, b);
    box(skirting, length + thickness * 0.5, 0.08, thickness + 0.025, m.wallCap, 0, 0.04);
  }

  for (const [left, top, w, d] of model.columns ?? []) {
    const [cw, cd] = [w * width, d * depth];
    const centre = point([left + w / 2, top + d / 2]);
    box(walls, cw, WALL_HEIGHT, cd, m.wall, centre.x, WALL_HEIGHT / 2 + 0.04, centre.z);
    box(walls, cw + 0.012, 0.03, cd + 0.012, m.wallCap, centre.x, WALL_HEIGHT + 0.055, centre.z);
    box(structure, cw + 0.025, 0.08, cd + 0.025, m.wallCap, centre.x, 0.04, centre.z);
  }

  // Scene-metre boxes, [minX, minZ, maxX, maxZ], for clearance checks.
  const boxOf = ([left, top, w, d]: readonly [number, number, number, number]) => {
    const a = point([left, top]);
    const b = point([left + w, top + d]);
    return [a.x, a.z, b.x, b.z] as const;
  };
  const columnBoxes = (model.columns ?? []).map(boxOf);
  const solidBoxes = [
    ...columnBoxes,
    ...model.furniture.filter(({ kind }) => kind !== "rug").map(({ rect }) => boxOf(rect)),
    ...model.walls.map(([from, to]) => {
      const a = point(from);
      const b = point(to);
      const half = thicknessOf(from, to) / 2;
      const vertical = Math.abs(a.x - b.x) < Math.abs(a.z - b.z);
      return [
        Math.min(a.x, b.x) - (vertical ? half : 0), Math.min(a.z, b.z) - (vertical ? 0 : half),
        Math.max(a.x, b.x) + (vertical ? half : 0), Math.max(a.z, b.z) + (vertical ? 0 : half),
      ] as const;
    }),
  ];
  const solidAt = (x: number, z: number) => solidBoxes.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
  // How far the wall beside each end of an opening runs clear, up to 0.3 m.
  const drapeRoom = (a: THREE.Vector3, b: THREE.Vector3, thickness: number, inside: 1 | -1) => {
    const along = b.clone().sub(a).normalize();
    const normal = new THREE.Vector3(-along.z, 0, along.x).multiplyScalar(inside);
    return ([[a, -1], [b, 1]] as const).map(([end, side]) => {
      for (let reach = 0.02; reach <= 0.3; reach += 0.02) {
        for (const offset of [0.08, 0.15, 0.22]) {
          const probe = end.clone().addScaledVector(along, side * reach).addScaledVector(normal, thickness / 2 + offset);
          if (solidAt(probe.x, probe.z)) return reach - 0.02;
        }
      }
      return 0.3;
    }) as unknown as readonly [number, number];
  };
  /** A piece's frame in scene metres: centre, local +x and +z (front) directions, size. */
  const frameOf = (item: PlanFurniture) => {
    const [left, top, pw, pd] = item.rect;
    const turn = THREE.MathUtils.degToRad(item.rotation ?? 0);
    const sideways = Math.abs(Math.sin(turn)) > 0.5;
    return {
      centre: point([left + pw / 2, top + pd / 2]),
      along: [Math.cos(turn), Math.sin(turn)] as const,
      front: [-Math.sin(turn), Math.cos(turn)] as const,
      w: sideways ? pd * depth : pw * width,
      d: sideways ? pw * width : pd * depth,
    };
  };
  /** Columns standing at a piece's back: their local x span and the local z of their face. */
  const columnsBehind = (item: PlanFurniture) => {
    const { centre, along, front, w, d } = frameOf(item);
    return columnBoxes.flatMap(([x0, z0, x1, z1]) => {
      const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [
        (x - centre.x) * along[0] + (z - centre.z) * along[1],
        (x - centre.x) * front[0] + (z - centre.z) * front[1],
      ] as const);
      const from = Math.max(-w / 2, Math.min(...corners.map(([x]) => x)));
      const to = Math.min(w / 2, Math.max(...corners.map(([x]) => x)));
      const back = Math.min(...corners.map(([, z]) => z));
      const face = Math.max(...corners.map(([, z]) => z));
      return to - from > 0.02 && back < -d / 2 + 0.03 && face > -d / 2 - 0.6 ? [{ from, to, face }] : [];
    });
  };
  /**
   * Where a media unit's TV hangs. With a column at its back, the TV goes on
   * the column's face or on the widest clear stretch of wall beside it, and is
   * never wider than that surface.
   */
  const screenFor = (item: PlanFurniture) => {
    const { w, d } = frameOf(item);
    const widest = Math.min(1.45, w * 0.7);
    const raised = columnsBehind(item).filter(({ face }) => face > -d / 2 + 0.01).sort((p, q) => p.from - q.from);
    if (!raised.length) return null;
    const options = raised.filter(({ face }) => face < d / 2 - 0.1)
      .map(({ from, to, face }) => ({ x: (from + to) / 2, width: Math.min(widest, to - from + 0.1), mount: face }));
    let start = -w / 2;
    for (const [from, to] of [...raised.map(({ from: f, to: t }) => [f, t]), [w / 2, w / 2]]) {
      if (from - start > 0.5) options.push({ x: (start + from) / 2, width: Math.min(widest, from - start - 0.1), mount: -d / 2 });
      start = Math.max(start, to);
    }
    return options.sort((p, q) => q.width - p.width)[0] ?? null;
  };
  /** Clear width on the wall behind a piece's middle, between any columns. */
  const artRoomFor = (item: PlanFurniture, gap: number | null) => {
    if (gap === null) return 0;
    const { d } = frameOf(item);
    const plane = -d / 2 - gap + 0.02;
    return columnsBehind(item).filter(({ face }) => face > plane)
      .reduce((room, { from, to }) => from <= 0 && to >= 0 ? 0 : Math.min(room, 2 * Math.min(Math.abs(from), Math.abs(to))), Infinity);
  };

  const balconies = model.floors.filter((item) => item.kind === "balcony");
  const onBalcony = ([x, y]: PlanPoint) => balconies.some(({ rect: [left, top, w, d] }) =>
    x >= left && x <= left + w && y >= top && y <= top + d);
  for (const item of model.openings) {
    const thickness = thicknessOf(item.from, item.to);
    // The positive normal of from→to is local +z; curtains hang on the room side.
    const [dx, dy] = [item.to[0] - item.from[0], item.to[1] - item.from[1]];
    const length = Math.hypot(dx, dy) || 1;
    const probe: PlanPoint = [
      (item.from[0] + item.to[0]) / 2 - dy / length * 0.03,
      (item.from[1] + item.to[1]) / 2 + dx / length * 0.03,
    ];
    const inside = onBalcony(probe) ? -1 : 1;
    const [from, to] = [point(item.from), point(item.to)];
    opening(walls, item, from, to, thickness, inside, m, item.kind === "balcony" ? drapeRoom(from, to, thickness, inside) : undefined);
  }

  // Glass railings close balcony edges that have no wall.
  for (const area of balconies) {
    const [left, top, w, d] = area.rect;
    const corners: PlanPoint[] = [[left, top], [left + w, top], [left + w, top + d], [left, top + d]];
    corners.forEach((corner, index) => {
      const edge = [corner, corners[(index + 1) % 4]] as const;
      const covered = model.walls.some((wall) => sameLine(wall, edge, 0.012))
        || model.openings.some((item) => sameLine([item.from, item.to], edge, 0.012));
      if (covered || !onOutline([(edge[0][0] + edge[1][0]) / 2, (edge[0][1] + edge[1][1]) / 2])) return;
      const a = point(edge[0]);
      const b = point(edge[1]);
      const length = a.distanceTo(b);
      const group = frameGroup(walls, a, b);
      box(group, length, 0.16, 0.2, m.wallCap, 0, 0.08);
      box(group, length - 0.04, 0.88, 0.014, m.glass, 0, 0.62);
      box(group, length, 0.045, 0.06, m.steel, 0, 1.08, 0, 0.012);
      for (let post = 0; post <= Math.ceil(length / 1.2); post += 1) {
        box(group, 0.035, 0.92, 0.035, m.steel, -length / 2 + post * length / Math.ceil(length / 1.2), 0.62);
      }
    });
  }

  // Distance from a piece's back edge to the face of a parallel wall behind it,
  // so art hangs on that wall and never over a window or doorway.
  const wallGap = (item: PlanFurniture) => {
    const [left, top, w, d] = item.rect;
    const turn = THREE.MathUtils.degToRad(item.rotation ?? 0);
    const sideways = Math.abs(Math.sin(turn)) > 0.5;
    const back = new THREE.Vector3(Math.round(Math.sin(turn)), 0, -Math.round(Math.cos(turn)));
    const centre = point([left + w / 2, top + d / 2]);
    const edge = centre.clone().addScaledVector(back, (sideways ? w * width : d * depth) / 2);
    const distanceTo = ([from, to]: readonly [PlanPoint, PlanPoint]) => {
      const a = point(from);
      const b = point(to);
      const along = b.clone().sub(a);
      if (Math.abs(along.clone().normalize().dot(back)) > 0.2) return Infinity;
      const t = THREE.MathUtils.clamp(edge.clone().sub(a).dot(along) / along.lengthSq(), 0, 1);
      const nearest = a.addScaledVector(along, t);
      // The nearest point must lie behind the piece, not beside it.
      return nearest.clone().sub(edge).dot(back) > -0.02 ? nearest.distanceTo(edge) : Infinity;
    };
    if (model.openings.some((opening) => distanceTo([opening.from, opening.to]) < 0.45)) return null;
    let nearest: { gap: number; from: PlanPoint; to: PlanPoint } | null = null;
    for (const [from, to] of model.walls) {
      const gap = distanceTo([from, to]);
      if (gap < 0.45 && (!nearest || gap < nearest.gap)) nearest = { gap, from, to };
    }
    const wall = nearest ? Math.max(0, nearest.gap - thicknessOf(nearest.from, nearest.to) / 2) : null;
    // A column right behind the middle is the face the art hangs on.
    const { d: pieceDepth } = frameOf(item);
    const column = columnsBehind(item).find(({ from, to, face }) => from <= 0 && to >= 0 && face <= -pieceDepth / 2 + 0.02);
    const columnGap = column ? Math.max(0, -pieceDepth / 2 - column.face) : null;
    return columnGap !== null && (wall === null || columnGap < wall) ? columnGap : wall;
  };
  const kitchens = model.furniture.filter((item) => item.kind === "kitchen");
  const sofas = model.furniture.filter((item) => item.kind === "sofa");
  // Ends of a sofa that touch another sofa piece, as in an L-shaped corner sofa.
  const joinedEnds = (item: PlanFurniture) => {
    const [left, top, w, d] = item.rect;
    const turn = THREE.MathUtils.degToRad(item.rotation ?? 0);
    const along = new THREE.Vector3(Math.round(Math.cos(turn)), 0, Math.round(Math.sin(turn)));
    const centre = point([left + w / 2, top + d / 2]);
    const halfLength = (Math.abs(along.x) > 0.5 ? w * width : d * depth) / 2;
    const ends: (-1 | 1)[] = [];
    for (const other of sofas) {
      if (other === item) continue;
      const [ol, ot, ow, od] = other.rect;
      const gap = 0.06;
      const touching = left < ol + ow + gap / width && left + w > ol - gap / width
        && top < ot + od + gap / depth && top + d > ot - gap / depth;
      if (!touching) continue;
      const offset = point([ol + ow / 2, ot + od / 2]).sub(centre).dot(along);
      if (Math.abs(offset) > halfLength * 0.6) ends.push(offset > 0 ? 1 : -1);
    }
    return ends;
  };
  model.furniture.forEach((item) => {
    const gap = item.kind === "bed" || item.kind === "sofa" ? wallGap(item) : null;
    structure.add(furniture(item, width, depth, m, upper, {
      wallGap: gap,
      kitchen: kitchens.length < 2 ? "full" : item === kitchens[0] ? "sink" : "hob",
      joined: item.kind === "sofa" ? joinedEnds(item) : [],
      screen: item.kind === "media" ? screenFor(item) : null,
      artRoom: artRoomFor(item, gap),
    }));
  });

  // A ceiling for interior views, with flush lights over beds and tables.
  const ceilingShape = new THREE.Shape();
  model.footprint.forEach((coordinate, index) => {
    const position = point(coordinate);
    if (index === 0) ceilingShape.moveTo(position.x, position.z);
    else ceilingShape.lineTo(position.x, position.z);
  });
  ceilingShape.closePath();
  const ceilingGeometry = new THREE.ShapeGeometry(ceilingShape);
  applyMetricUVs(ceilingGeometry, m.ceiling);
  const ceilingPlane = new THREE.Mesh(ceilingGeometry, m.ceiling);
  ceilingPlane.rotation.x = Math.PI / 2;
  ceilingPlane.position.y = WALL_HEIGHT + 0.04;
  upper.add(ceilingPlane);
  for (const item of model.furniture) {
    if (item.kind !== "bed" && item.kind !== "dining" && item.kind !== "table") continue;
    const [left, top, w, d] = item.rect;
    if (item.kind === "dining") continue;
    const lamp = cylinder(upper, 0.17, 0.17, 0.03, m.warmLight,
      (left + w / 2 - 0.5) * width, WALL_HEIGHT + 0.02, (top + d / 2 - 0.5) * depth, 32);
    lamp.castShadow = false;
  }

  // Walkthrough only: warm room lights, a pendant over each dining table and
  // soft daylight beyond the glazing (deliberately not a city view).
  ceiling.name = `${model.id}-ceiling`;
  const lights: { x: number; z: number; y: number; intensity: number; range: number; shadow?: boolean }[] = [];
  for (const item of model.furniture) {
    const [left, top, w, d] = item.rect;
    const x = (left + w / 2 - 0.5) * width;
    const z = (top + d / 2 - 0.5) * depth;
    if (item.kind === "dining") {
      pendant(ceiling, m, x, z, 1.62, 0.22);
      lights.push({ x, z, y: 1.5, intensity: 2, range: 4.5, shadow: true });
    } else if (item.kind === "bed" || item.kind === "table") {
      lights.push({ x, z, y: 2.5, intensity: 1.7, range: 5 });
    } else if (item.kind === "kitchen" && w * width * d * depth > 0.5) {
      lights.push({ x, z, y: 1.55, intensity: 1.2, range: 2.8 });
    } else if (item.kind === "vanity") {
      lights.push({ x, z, y: 2.3, intensity: 1.1, range: 3 });
    }
  }
  let shadowed = false;
  for (const { x, z, y, intensity, range, shadow } of lights.slice(0, 10)) {
    const light = new THREE.PointLight("#ffefd5", intensity, range, 2);
    light.position.set(x, y, z);
    if (shadow && !shadowed) {
      shadowed = true;
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 6;
      light.shadow.bias = -0.0003;
      light.shadow.normalBias = 0.025;
      light.shadow.radius = 2;
    }
    ceiling.add(light);
  }
  for (const [x, z, span, turn] of [
    [0, -depth / 2 - 6, width * 5, 0], [0, depth / 2 + 6, width * 5, 0],
    [-width / 2 - 6, 0, depth * 5, Math.PI / 2], [width / 2 + 6, 0, depth * 5, Math.PI / 2],
  ]) {
    const sky = mesh(ceiling, new THREE.PlaneGeometry(span, 14), m.daylight, x, 3.4, z);
    sky.rotation.y = turn;
    sky.castShadow = sky.receiveShadow = false;
  }
  ceiling.visible = false;
  return { structure, walls, ceiling, upper, materials: Object.values(m) };
}
