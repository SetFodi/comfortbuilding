import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import { test } from "node:test";
import * as THREE from "three";
import ts from "typescript";

const require = createRequire(import.meta.url);
const filename = fileURLToPath(new URL("../src/components/apartment-postprocessing.ts", import.meta.url));
const source = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: filename,
}).outputText;
const loaded = { exports: {} };
runInThisContext(`(function(module, exports, require) {\n${source}\n})`, { filename })(loaded, loaded.exports, require);
const { createApartmentPostprocessing } = loaded.exports;

/** Records the GPU-facing calls while the installed Three passes run unchanged. */
function recordingRenderer(scene, { pixelRatio = 2, failOnNormals = false } = {}) {
  let target = null;
  let clearAlpha = 1;
  const clearColor = new THREE.Color("#e7e1d5");
  const sceneFrames = [];
  const targets = new Set();
  const materialDisposals = new Map();
  const targetDisposals = new Map();
  const observeMaterial = (material) => {
    if (materialDisposals.has(material)) return;
    materialDisposals.set(material, 0);
    material.addEventListener("dispose", () => materialDisposals.set(material, materialDisposals.get(material) + 1));
  };
  const renderer = {
    autoClear: true,
    autoClearColor: true,
    autoClearDepth: true,
    autoClearStencil: true,
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.NeutralToneMapping,
    toneMappingExposure: 0.88,
    getPixelRatio: () => pixelRatio,
    getSize: (size) => size.set(1440, 700),
    getRenderTarget: () => target,
    setRenderTarget(next) {
      target = next;
      if (next && !targets.has(next)) {
        targets.add(next);
        targetDisposals.set(next, 0);
        next.addEventListener("dispose", () => targetDisposals.set(next, targetDisposals.get(next) + 1));
      }
    },
    getClearColor: (color) => color.copy(clearColor),
    getClearAlpha: () => clearAlpha,
    setClearColor(color, alpha) {
      clearColor.set(color);
      if (alpha !== undefined) clearAlpha = alpha;
    },
    setClearAlpha(alpha) { clearAlpha = alpha; },
    clear() {},
    clearDepth() {},
    render(object) {
      if (object === scene) {
        if (scene.overrideMaterial) observeMaterial(scene.overrideMaterial);
        sceneFrames.push({
          normals: !!scene.overrideMaterial,
          visible: scene.children.filter((child) => child.visible).map((child) => child.name),
        });
        if (failOnNormals && scene.overrideMaterial) throw new Error("Simulated WebGL failure");
      } else if (object.material) {
        observeMaterial(object.material);
      }
    },
  };
  return { renderer, sceneFrames, targets, materialDisposals, targetDisposals };
}

function furnishedScene() {
  const scene = new THREE.Scene();
  const surfaces = [
    ["wall", new THREE.MeshStandardMaterial(), true],
    ["glass", new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.12, depthWrite: false }), true],
    ["curtain", new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.46 }), true],
    ["overlay", new THREE.MeshBasicMaterial({ depthWrite: false }), true],
    ["hidden", new THREE.MeshPhysicalMaterial({ transparent: true }), false],
  ];
  for (const [name, material, visible] of surfaces) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
    mesh.name = name;
    mesh.visible = visible;
    scene.add(mesh);
  }
  return scene;
}

test("glass and curtains remain in the image but do not become solid ambient-occlusion surfaces", () => {
  const scene = furnishedScene();
  const recording = recordingRenderer(scene);
  const processing = createApartmentPostprocessing(recording.renderer, scene, new THREE.PerspectiveCamera());
  processing.resize(1440, 700);
  processing.render(1 / 60);
  assert.deepEqual(recording.sceneFrames, [
    { normals: false, visible: ["wall", "glass", "curtain", "overlay"] },
    { normals: true, visible: ["wall"] },
  ]);
  assert.deepEqual(scene.children.map(({ name, visible }) => [name, visible]), [
    ["wall", true], ["glass", true], ["curtain", true], ["overlay", true], ["hidden", false],
  ]);
  assert.equal(scene.overrideMaterial, null);
  processing.dispose();
});

test("an AO render failure restores visibility and the renderer state before propagating", () => {
  const scene = furnishedScene();
  const recording = recordingRenderer(scene, { failOnNormals: true });
  const renderer = recording.renderer;
  const previousTarget = new THREE.WebGLRenderTarget(30, 20);
  renderer.setRenderTarget(previousTarget);
  renderer.setClearColor("#abcdef", 0.4);
  const previousColor = renderer.getClearColor(new THREE.Color()).clone();
  const processing = createApartmentPostprocessing(renderer, scene, new THREE.PerspectiveCamera());
  assert.throws(() => processing.render(1 / 60), /Simulated WebGL failure/);
  assert.deepEqual(scene.children.map(({ visible }) => visible), [true, true, true, true, false]);
  assert.equal(scene.overrideMaterial, null);
  assert.equal(renderer.autoClear, true);
  assert.equal(renderer.getRenderTarget(), previousTarget);
  assert.equal(renderer.getClearAlpha(), 0.4);
  assert.ok(renderer.getClearColor(new THREE.Color()).equals(previousColor));
  processing.dispose();
  previousTarget.dispose();
});

test("walkthrough targets stay within two megapixels, DPR 1.5, and two MSAA samples", () => {
  for (const [width, height] of [[200, 100], [1440, 700], [3840, 2160], [1080, 4000]]) {
    const scene = furnishedScene();
    const recording = recordingRenderer(scene);
    const processing = createApartmentPostprocessing(recording.renderer, scene, new THREE.PerspectiveCamera());
    processing.resize(width, height);
    processing.render(1 / 60);
    assert.ok(recording.targets.size >= 4, "Runs the real color, normal, AO, and denoise passes");
    for (const target of recording.targets) {
      assert.ok(target.width * target.height <= 2_000_000, `${target.width}×${target.height}`);
      assert.ok(target.width <= width * 1.5);
      assert.ok(target.height <= height * 1.5);
      assert.ok(target.samples <= 2);
      assert.ok(Number.isInteger(target.width) && Number.isInteger(target.height));
    }
    if (width === 200) {
      assert.ok([...recording.targets].every((target) => target.width === 300 && target.height === 150));
    }
    assert.equal(recording.renderer.getPixelRatio(), 2, "Does not alter the direct renderer's DPR");
    processing.dispose();
  }
});

test("disposal releases every rendered postprocessing material and target exactly once", () => {
  const scene = furnishedScene();
  let sceneMaterialDisposals = 0;
  scene.children.forEach((mesh) => mesh.material.addEventListener("dispose", () => { sceneMaterialDisposals += 1; }));
  const recording = recordingRenderer(scene);
  const processing = createApartmentPostprocessing(recording.renderer, scene, new THREE.PerspectiveCamera());
  processing.resize(1440, 700);
  processing.render(1 / 60);
  const frameCount = recording.sceneFrames.length;
  processing.dispose();
  processing.dispose();
  processing.render(1 / 60);
  processing.resize(1000, 600);
  assert.ok(recording.materialDisposals.size >= 6);
  for (const [material, count] of recording.materialDisposals) {
    assert.equal(count, 1, `${material.name || material.type} is disposed once`);
  }
  for (const count of recording.targetDisposals.values()) assert.equal(count, 1);
  assert.equal(recording.sceneFrames.length, frameCount, "Disposed processing does not render again");
  assert.equal(sceneMaterialDisposals, 0, "The scene still owns its own surfaces");
});

test("unlit daylight backdrops stay visible in color without casting screen-space occlusion", () => {
  const scene = furnishedScene();
  const background = new THREE.Color("#e7e1d5");
  scene.background = background;
  const daylight = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial());
  daylight.name = "daylight";
  scene.add(daylight);
  const recording = recordingRenderer(scene);
  const processing = createApartmentPostprocessing(recording.renderer, scene, new THREE.PerspectiveCamera());
  processing.render(1 / 60);
  assert.ok(recording.sceneFrames[0].visible.includes("daylight"));
  assert.equal(recording.sceneFrames[1].visible.includes("daylight"), false);
  assert.equal(daylight.visible, true);
  assert.equal(scene.background, background);
  processing.dispose();
});

test("display-space anti-aliasing follows color output and uses its bounded input resolution", () => {
  const scene = furnishedScene();
  const recording = recordingRenderer(scene);
  const processing = createApartmentPostprocessing(recording.renderer, scene, new THREE.PerspectiveCamera());
  processing.resize(200, 100);
  processing.render(1 / 60);
  const materials = [...recording.materialDisposals.keys()];
  const antialias = materials.find((material) => material.name === "FXAAShader");
  assert.ok(antialias, "The display-space edge filter renders");
  assert.deepEqual(materials.slice(-2).map((material) => material.name), ["OutputShader", "FXAAShader"]);
  assert.deepEqual(antialias.uniforms.resolution.value.toArray(), [1 / 300, 1 / 150]);
  processing.resize(600, 300);
  processing.render(1 / 60);
  assert.deepEqual(antialias.uniforms.resolution.value.toArray(), [1 / 900, 1 / 450]);
  processing.resize(3840, 2160);
  processing.render(1 / 60);
  const input = antialias.uniforms.tDiffuse.value.image;
  assert.ok(input.width * input.height <= 2_000_000);
  assert.deepEqual(antialias.uniforms.resolution.value.toArray(), [1 / input.width, 1 / input.height]);
  processing.dispose();
  assert.equal(recording.materialDisposals.get(antialias), 1);
});
