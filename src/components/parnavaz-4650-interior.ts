import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ApartmentModel } from "@/lib/apartment-model";
import { boardToMetres, boardToNormalized } from "@/lib/parnavaz-apartment-models";
import { applyMetricUVs, daylightTexture, textureMaps } from "./apartment-surfaces";

type Surface = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial;

interface Interior {
  structure: THREE.Group;
  walls: THREE.Group;
  ceiling: THREE.Group;
  materials: THREE.Material[];
}

function createSurfaces() {
  const floorOak = textureMaps("floorOak");
  const oak = textureMaps("oak");
  const linen = textureMaps("linen");
  const plaster = textureMaps("plaster");
  const stone = textureMaps("stone");
  const rug = textureMaps("rug");
  const metal = textureMaps("metal");
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
      color: "#f6e4cc", ...floorOak, bumpScale: 0.0016, roughness: 0.62,
      clearcoat: 0.16, clearcoatRoughness: 0.44,
    }), 1.2, 2.4),
    oak: metric(physical({ color: "#f4dcbc", ...oak, bumpScale: 0.00065, roughness: 0.61, clearcoat: 0.1, clearcoatRoughness: 0.5 }), 0.45, 1.8),
    paleOak: metric(physical({ color: "#fae8cf", ...oak, bumpScale: 0.0005, roughness: 0.67, clearcoat: 0.08, clearcoatRoughness: 0.55 }), 0.45, 1.8),
    darkOak: standard({ color: "#8e7b61", roughness: 0.66 }),
    plaster: metric(standard({ color: "#efe4d4", ...plaster, bumpScale: 0.0004, roughness: 0.98, envMapIntensity: 0.6 }), 0.8),
    linen: fabric("#f1eadc", "#fffaf0"),
    cream: fabric("#f7f0e4", "#fffdf6", 0.00045),
    sage: fabric("#a5a48b", "#d6d8c2", 0.0007),
    tan: fabric("#b7a58c", "#e6d8c2"),
    rug: metric(physical({
      color: "#c7b79d", ...rug, bumpScale: 0.0016, roughness: 1,
      sheen: 0.45, sheenRoughness: 0.9, sheenColor: "#f0e4cf", envMapIntensity: 0.4,
    }), 0.26),
    // Honed stone: smooth enough to pick up soft highlights.
    stone: metric(physical({ color: "#f3e7d6", ...stone, bumpScale: 0.00045, roughness: 0.56, clearcoat: 0.18, clearcoatRoughness: 0.4 }), 0.8),
    bathTile: metric(physical({ color: "#d5cabe", ...stone, bumpScale: 0.0003, roughness: 0.52, clearcoat: 0.24, clearcoatRoughness: 0.32 }), 0.6),
    grout: standard({ color: "#ad9f8b", roughness: 1 }),
    ceramic: physical({ color: "#f7f1e8", roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06 }),
    brass: metric(standard({ color: "#b89a69", ...metal, bumpScale: 0.00012, metalness: 0.95, roughness: 0.32 }), 0.18),
    black: physical({ color: "#272722", roughness: 0.32, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
    screen: physical({ color: "#111718", metalness: 0.1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }),
    metal: metric(standard({ color: "#c6c7c1", ...metal, bumpScale: 0.00012, metalness: 0.95, roughness: 0.29 }), 0.18),
    leaf: physical({ color: "#65714c", roughness: 0.62, sheen: 0.4, sheenColor: "#a9b78a", side: THREE.DoubleSide }),
    lightLeaf: physical({ color: "#85906b", roughness: 0.66, sheen: 0.4, sheenColor: "#c4cfa4", side: THREE.DoubleSide }),
    soil: standard({ color: "#44392d", roughness: 1 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#e4ece8", transparent: true, opacity: 0.12, roughness: 0.03, ior: 1.5,
      metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6,
      depthWrite: false, side: THREE.DoubleSide,
    }),
    sheer: metric(standard({
      color: "#fff5e1", ...linen, bumpScale: 0.00025, transparent: true, opacity: 0.46,
      side: THREE.DoubleSide, roughness: 1, depthWrite: false,
    }), 0.16),
    // Without real reflections a perfect mirror reads black; a soft one reads as glass.
    mirror: standard({ color: "#eef0ea", metalness: 0.85, roughness: 0.12, envMapIntensity: 2.6 }),
    // Matte black taps and fittings, as on the board.
    matteBlack: physical({ color: "#1f1e1c", roughness: 0.55, metalness: 0.2 }),
    warmLight: standard({ color: "#fff1d8", emissive: "#ffe5bc", emissiveIntensity: 1.1, roughness: 1 }),
    artPaper: standard({ color: "#dfd4c2", roughness: 1 }),
    daylight: new THREE.MeshBasicMaterial({ map: daylightTexture(), side: THREE.DoubleSide }),
  };
}

type Surfaces = ReturnType<typeof createSurfaces>;

function add(
  parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: Surface,
  x = 0, y = 0, z = 0,
) {
  // Keep plank widths and fabric threads consistent across differently sized
  // furniture. The old 0–1 UVs stretched one weave over an entire sofa.
  applyMetricUVs(geometry, material);
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.castShadow = !material.transparent;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function block(
  parent: THREE.Object3D, width: number, height: number, depth: number, material: Surface,
  x = 0, y = height / 2, z = 0, radius = 0,
) {
  return add(parent, radius > 0
    ? new RoundedBoxGeometry(width, height, depth, 3, Math.min(radius, width / 3, height / 3, depth / 3))
    : new THREE.BoxGeometry(width, height, depth), material, x, y, z);
}

function round(
  parent: THREE.Object3D, top: number, bottom: number, height: number, material: Surface,
  x = 0, y = height / 2, z = 0, segments = 32,
) {
  return add(parent, new THREE.CylinderGeometry(top, bottom, height, segments), material, x, y, z);
}

function oval(parent: THREE.Object3D, w: number, d: number, h: number, material: Surface, y: number) {
  const item = round(parent, 0.5, 0.5, h, material, 0, y);
  item.scale.set(w, 1, d);
  return item;
}

function stem(parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, radius: number, material: Surface) {
  const direction = to.clone().sub(from);
  const item = round(parent, radius * 0.8, radius, direction.length(), material);
  item.position.copy(from).add(to).multiplyScalar(0.5);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function leafyPlant(parent: THREE.Object3D, m: Surfaces, radius: number, height: number) {
  round(parent, radius * 0.58, radius * 0.44, height * 0.24, m.stone);
  round(parent, radius * 0.53, radius * 0.53, 0.015, m.soil, 0, height * 0.245);
  for (let index = 0; index < 13; index += 1) {
    const angle = index * 2.39996;
    const reach = radius * (0.6 + index % 3 * 0.2);
    const top = new THREE.Vector3(Math.sin(angle) * reach, height * (0.55 + index % 4 * 0.09), Math.cos(angle) * reach);
    stem(parent, new THREE.Vector3(0, height * 0.2, 0), top, 0.007, m.darkOak);
    const leaf = add(parent, new THREE.SphereGeometry(1, 12, 8), index % 3 ? m.leaf : m.lightLeaf);
    leaf.position.copy(top);
    leaf.scale.set(radius * 0.22, height * 0.16, radius * 0.62);
    leaf.rotation.set(Math.sin(angle) * 0.8, angle, Math.cos(angle) * 0.4);
  }
}

function books(parent: THREE.Object3D, m: Surfaces, x: number, y: number, z: number, w = 0.22) {
  block(parent, w, 0.028, w * 0.72, m.artPaper, x, y, z);
  const book = block(parent, w * 0.84, 0.025, w * 0.65, m.sage, x + 0.02, y + 0.026, z);
  book.rotation.y = 0.12;
}

function tableLamp(parent: THREE.Object3D, m: Surfaces, x: number, y: number, z: number) {
  round(parent, 0.065, 0.09, 0.13, m.ceramic, x, y + 0.065, z);
  round(parent, 0.012, 0.012, 0.15, m.brass, x, y + 0.16, z);
  round(parent, 0.11, 0.145, 0.2, m.linen, x, y + 0.29, z);
  round(parent, 0.125, 0.125, 0.005, m.warmLight, x, y + 0.19, z);
  const light = new THREE.PointLight("#ffe6c1", 0.6, 2.6, 2);
  light.position.set(x, y + 0.22, z);
  parent.add(light);
}

function framedArt(parent: THREE.Object3D, m: Surfaces, width: number, height: number) {
  block(parent, width, height, 0.035, m.darkOak, 0, 0, 0);
  block(parent, width - 0.035, height - 0.035, 0.008, m.artPaper, 0, 0, 0.021);
  // A quiet botanical relief, like the line drawings in the supplied reference.
  for (let branch = 0; branch < 5; branch += 1) {
    const x = (branch - 2) * width * 0.11;
    const end = new THREE.Vector3(x * 1.7, height * (0.22 + branch % 3 * 0.06), 0.029);
    stem(parent, new THREE.Vector3(-width * 0.05, -height * 0.3, 0.029), end, 0.002, m.darkOak);
    const leaf = add(parent, new THREE.SphereGeometry(1, 10, 6), m.sage, end.x, end.y - height * 0.08, 0.03);
    leaf.scale.set(width * 0.055, height * 0.11, 0.004);
    leaf.rotation.z = branch * 0.31 - 0.5;
  }
}

function rug(parent: THREE.Object3D, m: Surfaces, w: number, d: number) {
  block(parent, w, 0.02, d, m.rug, 0, 0.016, 0, 0.008);
  for (const z of [-1, 1]) {
    for (let fringe = 0; fringe < 32; fringe += 1) {
      block(parent, 0.007, 0.009, 0.045, m.tan, (fringe / 31 - 0.5) * w * 0.97, 0.018, z * (d / 2 + 0.014));
    }
  }
}

function sofa(parent: THREE.Object3D, m: Surfaces, w: number, d: number) {
  for (const x of [-1, 1]) for (const z of [-1, 1]) round(parent, 0.026, 0.021, 0.14, m.darkOak, x * w * 0.4, 0.09, z * d * 0.31);
  block(parent, w, 0.28, d, m.linen, 0, 0.29, 0, 0.095);
  block(parent, w * 0.96, 0.55, d * 0.2, m.linen, 0, 0.65, -d * 0.4, 0.075);
  for (const side of [-1, 1]) block(parent, w * 0.095, 0.47, d, m.linen, side * w * 0.45, 0.48, 0, 0.07);
  for (let seat = 0; seat < 3; seat += 1) {
    block(parent, w * 0.79 / 3 - 0.013, 0.16, d * 0.76, m.cream, (seat - 1) * w * 0.79 / 3, 0.49, d * 0.065, 0.055);
    const back = block(parent, w * 0.8 / 3 - 0.025, 0.38, d * 0.14, m.cream, (seat - 1) * w * 0.8 / 3, 0.72, -d * 0.29, 0.055);
    back.rotation.x = -0.12;
  }
  for (const side of [-1, 1]) {
    const cushion = block(parent, w * 0.18, 0.37, 0.13, m.sage, side * w * 0.3, 0.7, -d * 0.08, 0.06);
    cushion.rotation.set(-0.2, side * 0.12, side * 0.16);
  }
}

function armchair(parent: THREE.Object3D, m: Surfaces, width: number, depth: number) {
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    const foot = round(parent, 0.024, 0.019, 0.42, m.oak, x * width * 0.35, 0.21, z * depth * 0.32);
    foot.rotation.z = x * 0.09;
  }
  block(parent, width * 0.83, 0.13, depth * 0.86, m.cream, 0, 0.43, 0, 0.055);
  const back = block(parent, width * 0.88, 0.46, depth * 0.15, m.cream, 0, 0.67, -depth * 0.39, 0.05);
  back.rotation.x = -0.14;
  for (const side of [-1, 1]) {
    block(parent, 0.04, 0.04, depth * 0.81, m.oak, side * width * 0.46, 0.63, 0.02, 0.012);
    round(parent, 0.022, 0.022, 0.24, m.oak, side * width * 0.46, 0.5, depth * 0.3);
  }
}

function duvet(parent: THREE.Object3D, m: Surfaces, width: number, depth: number) {
  const geometry = new THREE.PlaneGeometry(width, depth, 32, 32);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = -positions.getY(index);
    const edge = Math.pow(Math.abs(x / (width / 2)), 7);
    const folds = Math.sin(z * 19 + x * 9) * 0.008 + Math.sin(z * 8 - x * 14) * 0.01;
    positions.setXYZ(index, x, 0.65 - edge * 0.13 + folds, z + depth * 0.12);
  }
  geometry.computeVertexNormals();
  add(parent, geometry, m.cream);
  block(parent, width * 0.99, 0.28, 0.06, m.cream, 0, 0.49, depth * 0.61, 0.025);
  block(parent, width * 1.005, 0.042, depth * 0.25, m.sage, 0, 0.68, depth * 0.34, 0.018);
}

function bed(parent: THREE.Object3D, m: Surfaces, w: number, d: number) {
  rug(parent, m, w * 1.34, d * 1.18);
  block(parent, w, 0.28, d, m.tan, 0, 0.22, 0, 0.055);
  block(parent, w * 1.04, 0.9, 0.09, m.oak, 0, 0.51, -d * 0.5, 0.02);
  block(parent, w * 0.96, 0.21, d * 0.97, m.cream, 0, 0.45, 0, 0.08);
  duvet(parent, m, w * 1.03, d * 0.8);
  for (const side of [-1, 1]) {
    const pillow = block(parent, w * 0.42, 0.14, d * 0.21, m.cream, side * w * 0.24, 0.63, -d * 0.34, 0.065);
    pillow.rotation.y = side * 0.035;
  }
  const cushion = block(parent, w * 0.4, 0.13, d * 0.13, m.tan, 0, 0.72, -d * 0.2, 0.055);
  cushion.rotation.y = -0.07;
}

function vase(parent: THREE.Object3D, m: Surfaces, x: number, y: number, z: number, scale = 1) {
  const vessel = add(parent, new THREE.SphereGeometry(0.08, 24, 16), m.ceramic, x, y + 0.08 * scale, z);
  vessel.scale.setScalar(scale);
  round(parent, 0.027 * scale, 0.05 * scale, 0.08 * scale, m.ceramic, x, y + 0.16 * scale, z);
  for (let branch = 0; branch < 5; branch += 1) {
    const top = new THREE.Vector3(x + Math.sin(branch * 2) * 0.09 * scale, y + (0.31 + branch % 3 * 0.06) * scale, z + Math.cos(branch * 2) * 0.07 * scale);
    stem(parent, new THREE.Vector3(x, y + 0.19 * scale, z), top, 0.003 * scale, m.darkOak);
    const leaf = add(parent, new THREE.SphereGeometry(1, 10, 6), m.leaf);
    leaf.position.copy(top);
    leaf.scale.set(0.016 * scale, 0.04 * scale, 0.018 * scale);
    leaf.rotation.z = branch * 0.6;
  }
}

function curtain(parent: THREE.Object3D, m: Surfaces, w: number, h: number, sheer: boolean) {
  const geometry = new THREE.PlaneGeometry(w, h, 64, 12);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const wave = Math.sin((x / w + 0.5) * Math.PI * 16) * (sheer ? 0.028 : 0.05);
    positions.setZ(index, wave * (0.65 + (h / 2 - y) / h * 0.35));
  }
  geometry.computeVertexNormals();
  return add(parent, geometry, sheer ? m.sheer : m.linen, 0, h / 2 + 0.06);
}

function pendant(parent: THREE.Object3D, m: Surfaces, x: number, z: number, height: number, radius: number) {
  round(parent, 0.012, 0.012, 2.65 - height, m.darkOak, x, (2.65 + height) / 2, z);
  add(parent, new THREE.SphereGeometry(radius, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), m.oak, x, height, z);
  round(parent, radius * 0.9, radius * 0.9, 0.012, m.warmLight, x, height - 0.015, z);
  for (let weave = 0; weave < 9; weave += 1) {
    const fraction = (weave + 1) / 10;
    const ring = add(parent, new THREE.TorusGeometry(radius * Math.sin(fraction * Math.PI / 2), 0.0035, 5, 48), m.darkOak, x, height + radius * Math.cos(fraction * Math.PI / 2), z);
    ring.rotation.x = Math.PI / 2;
  }
  const light = new THREE.PointLight("#ffe8c7", 2, 4.5, 2);
  light.position.set(x, height - radius * 0.5, z);
  parent.add(light);
}

function batch(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const batches = new Map<string, THREE.Mesh<THREE.BufferGeometry, Surface>[]>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material) || object.material.transparent || object.userData.tv) return;
    const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
    const collection = batches.get(key) ?? [];
    collection.push(object);
    batches.set(key, collection);
  });
  for (const collection of batches.values()) {
    if (collection.length < 2) continue;
    const pieces = collection.map((object) => {
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
      return geometry;
    });
    const geometry = mergeGeometries(pieces);
    pieces.forEach((piece) => piece.dispose());
    if (!geometry) continue;
    const combined = new THREE.Mesh(geometry, collection[0].material);
    combined.castShadow = collection[0].castShadow;
    combined.receiveShadow = collection[0].receiveShadow;
    collection.forEach((object) => { object.removeFromParent(); object.geometry.dispose(); });
    group.add(combined);
  }
}

/**
 * Local design study traced from the supplied 46.50 m² concept board.
 * Coordinates below are source-image pixels, so every placement remains
 * comparable to that image. They are not dimensioned construction drawings.
 */
export function createParnavaz4650Interior(model: ApartmentModel, width: number, depth: number): Interior {
  const structure = new THREE.Group();
  const walls = new THREE.Group();
  const ceiling = new THREE.Group();
  structure.name = "parnavaz-4650-interior";
  walls.name = "parnavaz-4650-walls";
  ceiling.name = "parnavaz-4650-ceiling";
  const m = createSurfaces();
  const [cropX, cropY] = model.source.crop;
  // Positions follow the widened 3D layout; sizes stay at the plan's real
  // metres per board pixel, so furniture is not stretched with the walkways.
  const x = (pixel: number) => (boardToNormalized(model, [pixel, cropY])[0] - 0.5) * width;
  const z = (pixel: number) => (boardToNormalized(model, [cropX, pixel])[1] - 0.5) * depth;
  const metresX = boardToMetres(model.calibration, [cropX + 100, cropY])[0] - boardToMetres(model.calibration, [cropX, cropY])[0];
  const metresZ = boardToMetres(model.calibration, [cropX, cropY + 100])[1] - boardToMetres(model.calibration, [cropX, cropY])[1];
  const px = (pixels: number) => pixels * metresX / 100;
  const pz = (pixels: number) => pixels * metresZ / 100;
  const groupAt = (parent: THREE.Object3D, pixelX: number, pixelZ: number, rotation = 0) => {
    const group = new THREE.Group();
    group.position.set(x(pixelX), 0.045, z(pixelZ));
    group.rotation.y = -THREE.MathUtils.degToRad(rotation);
    parent.add(group);
    return group;
  };
  const rectangle = (parent: THREE.Object3D, rect: readonly [number, number, number, number], h: number, material: Surface, y = h / 2, radius = 0) => {
    // Floors and finishes span the widened layout edge to edge.
    const [left, top, w, d] = rect;
    const x0 = x(left);
    const x1 = x(left + w);
    const z0 = z(top);
    const z1 = z(top + d);
    // Widening inserts space at discrete board coordinates, so transforming
    // the pixel midpoint does not produce the centre of the final rectangle.
    return block(parent, x1 - x0, h, z1 - z0, material, (x0 + x1) / 2, y, (z0 + z1) / 2, radius);
  };

  // Floor and the uncovered balcony remain separate surfaces.
  rectangle(structure, [44, 103, 653, 825], 0.2, m.plaster, -0.065);
  rectangle(structure, [49, 108, 643, 710], 0.035, m.floor, 0.052);
  rectangle(structure, [52, 837, 637, 83], 0.035, m.stone, 0.052);
  rectangle(structure, [58, 115, 314, 137], 0.037, m.bathTile, 0.054);
  for (let tileX = 60; tileX < 372; tileX += 47) rectangle(structure, [tileX, 115, 0.6, 137], 0.003, m.grout, 0.075);
  for (let tileY = 115; tileY < 252; tileY += 47) rectangle(structure, [58, tileY, 314, 0.6], 0.003, m.grout, 0.075);

  for (const [a, b] of model.walls) {
    const ax = (a[0] - 0.5) * width;
    const az = (a[1] - 0.5) * depth;
    const bx = (b[0] - 0.5) * width;
    const bz = (b[1] - 0.5) * depth;
    const length = Math.hypot(bx - ax, bz - az);
    const wall = block(walls, length, 2.65, 0.115, m.plaster, (ax + bx) / 2, 1.37, (az + bz) / 2);
    wall.rotation.y = -Math.atan2(bz - az, bx - ax);
    const trim = block(structure, length, 0.085, 0.13, m.plaster, (ax + bx) / 2, 0.11, (az + bz) / 2);
    trim.rotation.y = wall.rotation.y;
  }
  for (const [ax, az, bx, bz] of [[383, 132, 383, 194], [372, 728, 372, 791], [494, 103, 590, 103]]) {
    const frame = groupAt(walls, (ax + bx) / 2, (az + bz) / 2);
    const opening = Math.hypot(x(bx) - x(ax), z(bz) - z(az));
    frame.rotation.y = -Math.atan2(z(bz) - z(az), x(bx) - x(ax));
    for (const side of [-1, 1]) block(frame, 0.045, 2.19, 0.15, m.oak, side * opening / 2, 1.12);
    block(frame, opening + 0.06, 0.055, 0.15, m.oak, 0, 2.24);
    block(frame, opening, 0.42, 0.115, m.plaster, 0, 2.47);
    if (az === 103) {
      block(frame, opening - 0.045, 2.16, 0.035, m.paleOak, 0, 1.12);
      block(frame, 0.1, 0.018, 0.04, m.brass, opening * 0.32, 1.08, 0.04, 0.006);
    }
  }

  // Kitchen run, exactly between the bathroom and the open living area.
  const kitchen = groupAt(structure, 213.5, 303);
  const kitchenW = px(285);
  const kitchenD = pz(66);
  block(kitchen, kitchenW, 0.81, kitchenD, m.oak, 0, 0.43, 0, 0.012);
  block(kitchen, kitchenW + 0.025, 0.055, kitchenD + 0.04, m.stone, 0, 0.865, 0, 0.012);
  for (let door = 0; door < 5; door += 1) {
    const dx = (door - 2) * kitchenW / 5;
    block(kitchen, kitchenW / 5 - 0.014, 0.73, 0.025, m.paleOak, dx, 0.45, kitchenD / 2 + 0.012);
    block(kitchen, kitchenW / 5 - 0.07, 0.012, 0.018, m.darkOak, dx, 0.79, kitchenD / 2 + 0.025);
  }
  // Oven and four-ring hob at the left, sink in the middle, fridge at the right.
  block(kitchen, kitchenW * 0.18, 0.5, 0.03, m.black, -kitchenW * 0.39, 0.48, kitchenD / 2 + 0.025, 0.01);
  block(kitchen, kitchenW * 0.14, 0.29, 0.007, m.screen, -kitchenW * 0.39, 0.44, kitchenD / 2 + 0.045);
  block(kitchen, kitchenW * 0.145, 0.022, 0.035, m.metal, -kitchenW * 0.39, 0.69, kitchenD / 2 + 0.05);
  block(kitchen, kitchenW * 0.19, 0.015, kitchenD * 0.76, m.black, -kitchenW * 0.39, 0.902, 0, 0.014);
  for (const ix of [-1, 1]) for (const iz of [-1, 1]) {
    const ring = add(kitchen, new THREE.TorusGeometry(0.058, 0.005, 6, 24), m.metal, -kitchenW * 0.39 + ix * 0.1, 0.914, iz * kitchenD * 0.2);
    ring.rotation.x = Math.PI / 2;
  }
  block(kitchen, 0.39, 0.012, 0.39, m.metal, -0.02, 0.903, 0, 0.025);
  block(kitchen, 0.32, 0.014, 0.32, m.stone, -0.02, 0.911, 0, 0.025);
  round(kitchen, 0.013, 0.013, 0.26, m.matteBlack, -0.02, 1.03, -kitchenD * 0.34);
  const faucet = add(kitchen, new THREE.TorusGeometry(0.09, 0.012, 8, 24, Math.PI), m.matteBlack, -0.02, 1.15, -kitchenD * 0.2);
  faucet.rotation.y = Math.PI / 2;
  block(kitchen, kitchenW * 0.2, 1.75, kitchenD, m.metal, kitchenW * 0.395, 0.9, 0, 0.025);
  block(kitchen, 0.018, 0.43, 0.027, m.black, kitchenW * 0.325, 1.27, kitchenD / 2 + 0.025, 0.006);
  for (let cabinet = 0; cabinet < 4; cabinet += 1) {
    const dx = -kitchenW * 0.4 + cabinet * kitchenW * 0.195;
    block(kitchen, kitchenW * 0.19, 0.72, kitchenD * 0.62, m.paleOak, dx, 1.99, -kitchenD * 0.21, 0.008);
    block(kitchen, kitchenW * 0.17, 0.012, 0.02, m.darkOak, dx, 1.65, kitchenD * 0.105);
  }
  block(kitchen, kitchenW * 0.78, 0.018, 0.015, m.warmLight, -kitchenW * 0.1, 1.62, kitchenD * 0.11);
  const counterLight = new THREE.PointLight("#ffe7c5", 1.4, 2.7, 2);
  counterLight.position.set(-0.4, 1.5, 0.15);
  kitchen.add(counterLight);

  const bar = groupAt(structure, 427.5, 301.5);
  block(bar, px(139), 0.075, pz(49), m.oak, 0, 0.94, 0, 0.025);
  block(bar, 0.055, 0.9, pz(45), m.oak, px(139) * 0.43, 0.46);
  vase(bar, m, px(139) * 0.24, 0.98, -0.03, 0.8);
  round(bar, 0.09, 0.07, 0.045, m.ceramic, -0.2, 0.995, 0);
  for (const chairX of [404, 457]) {
    const stool = groupAt(structure, chairX, 351);
    for (const ix of [-1, 1]) for (const iz of [-1, 1]) round(stool, 0.02, 0.017, 0.64, m.oak, ix * 0.13, 0.32, iz * 0.13);
    block(stool, px(41), 0.07, pz(38), m.linen, 0, 0.66, 0, 0.025);
    block(stool, px(41), 0.24, 0.035, m.oak, 0, 0.83, pz(38) * 0.43, 0.012);
    block(stool, 0.28, 0.025, 0.025, m.oak, 0, 0.28, 0.14, 0.008);
  }
  pendant(ceiling, m, x(429), z(297), 2.13, 0.2);

  const sofaGroup = groupAt(structure, 623.5, 575, 90);
  sofa(sofaGroup, m, pz(276), px(85));
  const livingRug = groupAt(structure, 525, 591);
  rug(livingRug, m, px(145), pz(277));
  const coffee = groupAt(structure, 518.5, 591);
  oval(coffee, px(63), pz(132), 0.06, m.oak, 0.4);
  for (const end of [-1, 1]) {
    const leg = round(coffee, 0.11, 0.13, 0.35, m.oak, 0, 0.205, end * pz(132) * 0.25);
    leg.scale.x = 1.5;
  }
  vase(coffee, m, 0.01, 0.44, -pz(132) * 0.27, 0.8);
  books(coffee, m, -0.015, 0.455, pz(132) * 0.22, 0.2);
  round(coffee, 0.045, 0.035, 0.065, m.ceramic, 0.08, 0.475, 0);

  // The board shows a low media cabinet here, not a floor-to-ceiling wardrobe.
  const media = groupAt(structure, 399, 580.5, 270);
  const mediaW = pz(215);
  block(media, mediaW, 0.4, px(32), m.oak, 0, 0.27, 0, 0.012);
  for (let panel = 0; panel < 5; panel += 1) block(media, mediaW / 5 - 0.008, 0.32, 0.016, m.paleOak, (panel - 2) * mediaW / 5, 0.28, px(32) / 2 + 0.009);
  block(media, mediaW * 0.68, 0.77, 0.035, m.black, 0, 1.04, -0.01, 0.01);
  // The walkthrough can switch this screen on.
  block(media, mediaW * 0.66, 0.73, 0.007, m.screen, 0, 1.04, 0.012).userData.tv = true;
  for (const side of [-1, 1]) stem(media, new THREE.Vector3(side * mediaW * 0.22, 0.62, 0.005), new THREE.Vector3(side * mediaW * 0.27, 0.48, 0.08), 0.011, m.black);
  vase(media, m, mediaW * 0.42, 0.48, 0, 0.55);
  books(media, m, -mediaW * 0.42, 0.48, 0, 0.14);
  const livingArt = groupAt(walls, 686, 570, 90);
  livingArt.position.y = 1.65;
  framedArt(livingArt, m, 0.69, 0.88);

  const bedGroup = groupAt(structure, 207.5, 603);
  bed(bedGroup, m, px(167), pz(238));
  for (const shelfX of [104, 311]) {
    const nightstand = groupAt(structure, shelfX, 507);
    block(nightstand, px(38), 0.08, pz(48), m.oak, 0, 0.45, 0, 0.012);
    block(nightstand, px(35), 0.24, pz(44), m.paleOak, 0, 0.28, 0, 0.01);
    tableLamp(nightstand, m, 0, 0.49, -0.03);
  }
  const headShelves = groupAt(structure, 210, 459);
  const shelvingWidth = px(285);
  const shelvingDepth = pz(38);
  block(headShelves, shelvingWidth, 2.35, 0.018, m.paleOak, 0, 1.225, -shelvingDepth / 2, 0.005);
  for (const side of [-1, 1]) {
    block(headShelves, 0.025, 2.35, shelvingDepth, m.paleOak, side * shelvingWidth / 2, 1.225, 0, 0.005);
    block(headShelves, 0.025, 2.35, shelvingDepth, m.paleOak, side * px(87), 1.225, 0, 0.005);
  }
  for (const elevation of [0.065, 2.39]) block(headShelves, shelvingWidth, 0.035, shelvingDepth, m.paleOak, 0, elevation, 0, 0.005);
  block(headShelves, px(172), 1.62, 0.025, m.plaster, 0, 1.19, shelvingDepth / 2 + 0.01);
  for (const side of [-1, 1]) {
    const shelfX = side * px(112);
    for (const y of [0.65, 1.14, 1.62, 2.12]) block(headShelves, px(47), 0.035, pz(42), m.oak, shelfX, y, 0.03);
    vase(headShelves, m, shelfX, 1.66, 0.03, side < 0 ? 0.7 : 1);
    for (let book = 0; book < 4; book += 1) {
      block(headShelves, 0.025, 0.18 + book % 2 * 0.04, 0.11, book % 2 ? m.sage : m.artPaper,
        shelfX - 0.08 + book * 0.035, 1.14 + 0.11, 0.04);
    }
  }
  const bedArt = groupAt(walls, 211, 486);
  bedArt.position.y = 1.67;
  framedArt(bedArt, m, 0.93, 0.58);
  const bedroomWardrobe = groupAt(structure, 351, 582, 90);
  const wardrobeW = pz(281);
  block(bedroomWardrobe, wardrobeW, 2.38, px(22), m.paleOak, 0, 1.24, 0, 0.01);
  for (let panel = 0; panel < 4; panel += 1) {
    block(bedroomWardrobe, wardrobeW / 4 - 0.012, 2.29, 0.015, m.oak, (panel - 1.5) * wardrobeW / 4, 1.24, px(22) / 2 + 0.01);
    block(bedroomWardrobe, 0.01, 0.27, 0.023, m.brass, (panel - 1.5) * wardrobeW / 4 - wardrobeW / 9, 1.16, px(22) / 2 + 0.027);
  }

  // Bathroom fixtures and restrained tile joints.
  // Bath along the left wall, taps at the top end: a white tub with a rolled
  // rim in a tiled panel, a fixed glass screen and a matte black shower set.
  const tub = groupAt(structure, 120.5, 184);
  const tubW = px(69);
  const tubD = pz(126);
  block(tub, tubW, 0.5, tubD, m.bathTile, 0, 0.25, 0, 0.01);
  block(tub, tubW * 0.97, 0.06, tubD * 0.97, m.ceramic, 0, 0.52, 0, 0.025);
  block(tub, tubW * 0.8, 0.012, tubD * 0.84, m.stone, 0, 0.553, 0, 0.004);
  round(tub, 0.012, 0.012, 0.16, m.matteBlack, 0, 0.64, -tubD / 2 + 0.04, 10);
  block(tub, 0.022, 0.022, 0.12, m.matteBlack, 0, 0.71, -tubD / 2 + 0.09, 0.006);
  const screenAt = -tubD / 2 + Math.min(0.8, tubD * 0.45);
  block(tub, tubW * 0.9, 1.4, 0.012, m.glass, 0, 1.27, screenAt);
  block(tub, tubW * 0.9, 0.016, 0.016, m.matteBlack, 0, 1.97, screenAt);
  round(tub, 0.011, 0.011, 1.15, m.matteBlack, 0, 1.45, -tubD / 2 + 0.04, 8);
  block(tub, 0.012, 0.012, 0.3, m.matteBlack, 0, 2.02, -tubD / 2 + 0.18);
  round(tub, 0.12, 0.12, 0.018, m.matteBlack, 0, 2.0, -tubD / 2 + 0.32, 28);
  block(tub, 0.24, 0.06, 0.05, m.matteBlack, 0, 1.05, -tubD / 2 + 0.025, 0.02);

  // Toilet with its back to the bottom wall: bowl, seat and close-coupled cistern.
  const toilet = groupAt(structure, 221, 223.5, 180);
  const toiletW = px(36);
  const toiletD = pz(53);
  const bowl = add(toilet, new THREE.SphereGeometry(0.5, 28, 18), m.ceramic, 0, 0.3, toiletD * 0.1);
  bowl.scale.set(toiletW * 0.82, 0.45, toiletD * 0.78);
  oval(toilet, toiletW * 0.84, toiletD * 0.74, 0.04, m.ceramic, 0.46).position.z = toiletD * 0.1;
  block(toilet, toiletW * 0.74, 0.42, toiletD * 0.24, m.ceramic, 0, 0.62, -toiletD * 0.36, 0.05);
  block(toilet, 0.1, 0.008, 0.04, m.matteBlack, 0, 0.834, -toiletD * 0.36);

  // Oak washstand against the bottom wall: a drawer under the stone top, an
  // open shelf of towels, a white vessel basin and a black tap.
  const vanity = groupAt(structure, 329.5, 230.5, 180);
  const vanityW = px(61);
  const vanityD = pz(43);
  block(vanity, vanityW, 0.18, vanityD, m.oak, 0, 0.66, 0, 0.012);
  block(vanity, vanityW * 0.94, 0.14, 0.012, m.paleOak, 0, 0.66, vanityD / 2 + 0.006, 0.004);
  block(vanity, vanityW * 0.22, 0.012, 0.018, m.darkOak, 0, 0.66, vanityD / 2 + 0.016);
  block(vanity, vanityW, 0.025, vanityD, m.oak, 0, 0.16, 0, 0.008);
  for (const side of [-1, 1]) block(vanity, 0.03, 0.6, vanityD, m.oak, side * (vanityW / 2 - 0.015), 0.45, 0);
  for (const at of [-0.2, 0.2]) {
    block(vanity, Math.min(0.3, vanityW * 0.32), 0.055, 0.24, m.cream, vanityW * at, 0.2, 0.02, 0.02);
    block(vanity, Math.min(0.3, vanityW * 0.32), 0.055, 0.24, m.linen, vanityW * at, 0.258, 0.02, 0.02);
  }
  block(vanity, vanityW + 0.02, 0.035, vanityD + 0.02, m.stone, 0, 0.77, 0, 0.008);
  const basin = round(vanity, Math.min(vanityW, vanityD) * 0.36, Math.min(vanityW, vanityD) * 0.26, 0.13, m.ceramic, 0, 0.85, vanityD * 0.05);
  basin.scale.x = 1.15;
  round(vanity, 0.011, 0.011, 0.26, m.matteBlack, 0, 0.92, -vanityD * 0.4, 8);
  block(vanity, 0.012, 0.012, 0.12, m.matteBlack, 0, 1.04, -vanityD * 0.34);
  const bathroomMirror = groupAt(walls, 329, 251, 180);
  bathroomMirror.position.y = 1.5;
  // A round mirror with a warm glow behind its edge.
  const glow = round(bathroomMirror, 0.31, 0.31, 0.01, m.warmLight);
  glow.rotation.x = Math.PI / 2;
  glow.position.z = -0.005;
  const mirror = round(bathroomMirror, 0.29, 0.29, 0.025, m.mirror);
  mirror.rotation.x = Math.PI / 2;
  for (let row = 1; row < 6; row += 1) rectangle(walls, [58, 110, 314, 0.6], 0.003, m.grout, row * 0.42);

  const entranceConsole = groupAt(structure, 641.5, 194, 90);
  block(entranceConsole, pz(126), 0.76, px(39), m.oak, 0, 0.42, 0, 0.015);
  vase(entranceConsole, m, pz(126) * 0.28, 0.82, 0, 1.3);
  round(entranceConsole, 0.08, 0.05, 0.045, m.stone, -pz(126) * 0.25, 0.845);
  rectangle(structure, [524, 194, 75, 50], 0.015, m.rug, 0.079);

  const readingChair = groupAt(structure, 612.5, 750.5, 45);
  armchair(readingChair, m, px(65), pz(57));
  const balconyChair = groupAt(structure, 562, 882.5, 30);
  armchair(balconyChair, m, px(68), pz(65));
  for (const [plantX, plantZ, radius, height] of [
    [622, 875, 0.24, 1.05], [635, 696, 0.18, 1.05], [86, 655, 0.16, 0.95],
  ]) leafyPlant(groupAt(structure, plantX, plantZ), m, radius, height);

  // Glazing and curtains follow the balcony openings visible in the plan.
  for (const [left, right] of [[145, 265], [383, 630]]) {
    const windowWidth = x(right) - x(left);
    const glazing = groupAt(walls, (left + right) / 2, 823);
    glazing.position.x = (x(left) + x(right)) / 2;
    block(glazing, windowWidth, 2.34, 0.016, m.glass, 0, 1.24);
    for (const side of [-1, 0, 1]) block(glazing, 0.035, 2.38, 0.055, m.darkOak, side * windowWidth / 2, 1.24);
    for (const elevation of [0.07, 2.41]) block(glazing, windowWidth + 0.04, 0.045, 0.055, m.darkOak, 0, elevation);
    block(glazing, windowWidth + 0.115, 0.225, 0.115, m.plaster, 0, 2.54);
    const rail = round(glazing, 0.012, 0.012, windowWidth + 0.3, m.brass, 0, 2.55, -0.15);
    rail.rotation.z = Math.PI / 2;
    for (const side of [-1, 1]) {
      const drape = curtain(glazing, m, Math.min(0.36, windowWidth * 0.27), 2.43, false);
      drape.position.set(side * (windowWidth / 2 + 0.04), 1.275, -0.15);
      const sheer = curtain(glazing, m, windowWidth * 0.26, 2.39, true);
      sheer.position.set(side * windowWidth * 0.31, 1.255, -0.09);
    }
  }
  // Side windows shown on the plan get clear panes and slim oak frames.
  for (const [start, end] of [[259, 326], [516, 603]]) {
    const sideWindow = groupAt(walls, 49, (start + end) / 2, 90);
    block(sideWindow, pz(end - start), 1.42, 0.016, m.glass, 0, 1.55);
    for (const side of [-1, 1]) block(sideWindow, 0.03, 1.48, 0.045, m.darkOak, side * pz(end - start) / 2, 1.55);
    for (const h of [0.82, 2.28]) block(sideWindow, pz(end - start), 0.03, 0.045, m.darkOak, 0, h);
    block(sideWindow, pz(end - start), 0.77, 0.115, m.plaster, 0, 0.43);
    block(sideWindow, pz(end - start), 0.42, 0.115, m.plaster, 0, 2.47);
  }
  const balustrade = groupAt(structure, 371, 923);
  const railWidth = px(625);
  block(balustrade, railWidth, 0.96, 0.018, m.glass, 0, 0.55);
  block(balustrade, railWidth, 0.04, 0.045, m.metal, 0, 1.05);
  for (let post = 0; post < 6; post += 1) block(balustrade, 0.024, 1, 0.04, m.metal, (post / 5 - 0.5) * railWidth, 0.55);

  // Ceiling stops at the balcony doors. It is revealed only for interior views.
  rectangle(ceiling, [49, 103, 648, 720], 0.11, m.plaster, 2.74);
  for (const [lightX, lightZ] of [[187, 176], [516, 400], [537, 650]]) {
    round(ceiling, 0.065, 0.065, 0.012, m.warmLight, x(lightX), 2.689, z(lightZ));
    const light = new THREE.PointLight("#ffefd5", 1.8, 5, 2);
    light.position.set(x(lightX), 2.5, z(lightZ));
    if (lightZ === 650) {
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
  pendant(ceiling, m, x(207), z(604), 2.37, 0.24);
  // Neutral daylight beyond the windows is deliberately not a city view.
  const outside = add(ceiling, new THREE.PlaneGeometry(width * 5, 14), m.daylight, 0, 3.4, z(923) + 6);
  outside.castShadow = outside.receiveShadow = false;
  const sideDaylight = add(ceiling, new THREE.PlaneGeometry(depth * 4, 14), m.daylight, x(49) - 6, 3.4, 0);
  sideDaylight.rotation.y = Math.PI / 2;
  sideDaylight.castShadow = sideDaylight.receiveShadow = false;

  batch(structure);
  batch(walls);
  batch(ceiling);
  ceiling.visible = false;
  return { structure, walls, ceiling, materials: Object.values(m) };
}
