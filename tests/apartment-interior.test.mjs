import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import ts from "typescript";
import * as THREE from "three";

const require = createRequire(import.meta.url);

function loadSource(path, dependencies = {}) {
  const filename = fileURLToPath(new URL(`../${path}`, import.meta.url));
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const loaded = { exports: {} };
  runInThisContext(`(function(module, exports, require) {\n${source}\n})`, { filename })(
    loaded, loaded.exports, (name) => dependencies[name] ?? require(name),
  );
  return loaded.exports;
}

const models = loadSource("src/lib/parnavaz-apartment-models.ts");
const surfaces = loadSource("src/components/apartment-surfaces.ts", { three: THREE });
const { createParnavaz4650Interior } = loadSource("src/components/parnavaz-4650-interior.ts", {
  three: THREE,
  "@/lib/parnavaz-apartment-models": models,
  "./apartment-surfaces": surfaces,
});
const model = models.getParnavazApartmentModel(46.5);
assert.ok(model);

// Exercise the actual geometry and procedural-map builder without a GPU.
// Only the Canvas2D storage API is substituted; Three geometry is unchanged.
const previousDocument = globalThis.document;
globalThis.document = {
  createElement() {
    const canvas = {
      width: 0,
      height: 0,
      pixels: null,
      getContext() {
        return {
          createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
          putImageData: (pixels) => { canvas.pixels = pixels.data; },
          createLinearGradient: () => ({ addColorStop() {} }),
          fillRect() {},
        };
      },
    };
    return canvas;
  },
};
let interior;
try {
  interior = createParnavaz4650Interior(model, model.size.width, model.size.depth);
} finally {
  if (previousDocument === undefined) delete globalThis.document;
  else globalThis.document = previousDocument;
}

function world(x, z) {
  const point = models.boardToNormalized(model, [x, z]);
  return {
    x: (point[0] - 0.5) * model.size.width,
    z: (point[1] - 0.5) * model.size.depth,
  };
}

function meshes(group) {
  const result = [];
  group.traverse((object) => { if (object.isMesh) result.push(object); });
  return result;
}

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} should equal ${expected}`);
}

test("ceiling covers the actual widened room edges and overlaps wall tops", () => {
  const ceiling = meshes(interior.ceiling).find(({ material }) => material.roughness === 0.98);
  assert.ok(ceiling);
  const bounds = new THREE.Box3().setFromObject(ceiling);
  const left = world(49, 103);
  const right = world(697, 823);
  near(bounds.min.x, left.x);
  near(bounds.max.x, right.x);
  near(bounds.min.z, left.z);
  near(bounds.max.z, right.z);
  assert.ok(bounds.min.y < 2.695 && bounds.min.y > 2.675);
  // The previous pixel-midpoint approach shifted this ceiling 12.5 cm left
  // and 20 cm backwards when the 3D walkways were widened.
  const oldCentre = world(373, 463);
  near(oldCentre.x - (left.x + right.x) / 2, -0.125);
  near(oldCentre.z - (left.z + right.z) / 2, 0.2);
});

test("wood floor and balcony glazing also span their transformed endpoints", () => {
  const floor = meshes(interior.structure).find(({ material }) => material.userData.textureMetres?.[0] === 1.2);
  const bounds = new THREE.Box3().setFromObject(floor);
  near(bounds.min.x, world(49, 108).x);
  near(bounds.max.x, world(692, 818).x);
  near(bounds.min.z, world(49, 108).z);
  near(bounds.max.z, world(692, 818).z);
  const panes = meshes(interior.walls).filter(({ geometry, material }) =>
    material.opacity === 0.12 && geometry.parameters?.height === 2.34);
  assert.equal(panes.length, 2);
  for (const [index, [left, right]] of [[145, 265], [383, 630]].entries()) {
    const paneBounds = new THREE.Box3().setFromObject(panes[index]);
    near(paneBounds.min.x, world(left, 823).x);
    near(paneBounds.max.x, world(right, 823).x);
  }
});

test("material maps keep color separate from linear height and roughness data", () => {
  for (const material of interior.materials) {
    if (!material.bumpMap) continue;
    assert.notEqual(material.bumpMap, material.map);
    assert.notEqual(material.roughnessMap, material.map);
    assert.equal(material.map.colorSpace, THREE.SRGBColorSpace);
    assert.equal(material.bumpMap.colorSpace, THREE.NoColorSpace);
    assert.equal(material.roughnessMap.colorSpace, THREE.NoColorSpace);
    const heights = new Set();
    const roughness = new Set();
    for (let index = 0; index < material.bumpMap.image.pixels.length; index += 256) {
      heights.add(material.bumpMap.image.pixels[index]);
      roughness.add(material.roughnessMap.image.pixels[index]);
    }
    assert.ok(heights.size > 5, "Height map contains surface detail");
    assert.ok(roughness.size > 5, "Roughness map contains surface variation");
    assert.ok(material.bumpScale <= 0.0016, "Surface detail stays below two millimetres");
  }
});

test("floor UVs use metre-sized planks and every generated vertex is finite", () => {
  const floor = meshes(interior.structure).find(({ material }) => material.userData.textureMetres?.[0] === 1.2);
  const positions = floor.geometry.getAttribute("position");
  const normals = floor.geometry.getAttribute("normal");
  const uv = floor.geometry.getAttribute("uv");
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    if (normals.getY(vertex) < 0.99) continue;
    near(uv.getX(vertex), positions.getX(vertex) / 1.2);
    near(uv.getY(vertex), positions.getZ(vertex) / 2.4);
  }
  for (const group of [interior.structure, interior.walls, interior.ceiling]) {
    for (const mesh of meshes(group)) {
      for (const value of mesh.geometry.getAttribute("position").array) assert.ok(Number.isFinite(value));
    }
  }
});

test("all generated textures are reachable through returned materials for disposal", () => {
  const textures = new Set();
  for (const material of interior.materials) {
    for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
  }
  assert.equal(textures.size, 22);
  let disposed = 0;
  for (const texture of textures) {
    texture.addEventListener("dispose", () => { disposed += 1; });
    texture.dispose();
  }
  assert.equal(disposed, textures.size);
});
