import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import * as THREE from "three";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const modules = new Map();

function loadSource(relativePath) {
  const filename = resolve(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = { exports: {} };
  modules.set(filename, loaded);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  const loadDependency = (specifier) => {
    if (specifier === "three") return THREE;
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const dependency = specifier.startsWith("@/")
        ? resolve(root, "src", specifier.slice(2))
        : resolve(dirname(filename), specifier);
      return loadSource(dependency.endsWith(".ts") ? dependency : `${dependency}.ts`);
    }
    return require(specifier);
  };
  runInThisContext(`(function(module, exports, require) {\n${source}\n})`, {
    filename,
  })(loaded, loaded.exports, loadDependency);
  return loaded.exports;
}

const { createWalkthroughControls } = loadSource("src/components/apartment-walkthrough-controls.ts");
const { boardToNormalized, getParnavazApartmentModel } = loadSource("src/lib/parnavaz-apartment-models.ts");
const { createWalkthroughLayout, canWalkTo } = loadSource("src/lib/apartment-walkthrough.ts");
const model = getParnavazApartmentModel(46.5);
const layout = createWalkthroughLayout(model);

function event(type, properties = {}) {
  return Object.assign(new Event(type, { cancelable: true, bubbles: true }), properties);
}

function close(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} is near ${expected}`);
}

function createHarness(lockMode = "unavailable") {
  const originalGlobals = new Map(
    ["document", "window", "performance"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  let clock = 1000;
  const document = new EventTarget();
  const window = new EventTarget();
  const dialog = new EventTarget();
  const canvas = new EventTarget();
  canvas.style = {};
  const captures = new Set();
  let resolveLock;
  document.activeElement = null;
  document.pointerLockElement = null;
  document.hidden = false;
  document.exitPointerLock = () => {
    document.pointerLockElement = null;
    document.dispatchEvent(event("pointerlockchange"));
  };
  canvas.closest = (selector) => selector === "dialog" ? dialog : null;
  canvas.focus = () => { document.activeElement = canvas; };
  canvas.setPointerCapture = (id) => captures.add(id);
  canvas.hasPointerCapture = (id) => captures.has(id);
  canvas.releasePointerCapture = (id) => captures.delete(id);
  if (lockMode === "granted") {
    canvas.requestPointerLock = () => {
      document.pointerLockElement = canvas;
      document.dispatchEvent(event("pointerlockchange"));
    };
  } else if (lockMode === "throws") {
    canvas.requestPointerLock = () => { throw new Error("Pointer lock unavailable"); };
  } else if (lockMode === "rejects") {
    canvas.requestPointerLock = () => Promise.reject(new Error("Pointer lock denied"));
  } else if (lockMode === "deferred") {
    canvas.requestPointerLock = () => new Promise((resolve) => { resolveLock = resolve; });
  }
  Object.defineProperty(globalThis, "document", { configurable: true, value: document });
  Object.defineProperty(globalThis, "window", { configurable: true, value: window });
  Object.defineProperty(globalThis, "performance", {
    configurable: true,
    value: { now: () => clock },
  });
  const camera = new THREE.PerspectiveCamera(75, 1.6, 0.05, 100);
  const states = [];
  const poses = [];
  let invalidations = 0;
  const controls = createWalkthroughControls(
    camera,
    canvas,
    model,
    () => { invalidations += 1; },
    (state) => states.push(state),
    (pose) => poses.push(pose),
  );
  const dispatchKey = (type, code, modifiers = {}) => {
    const input = event(type, {
      code,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      ...modifiers,
    });
    document.dispatchEvent(input);
    return input;
  };
  return {
    document, window, dialog, canvas, camera, states, poses, controls, captures,
    keyDown: (code, modifiers) => dispatchKey("keydown", code, modifiers),
    keyUp: (code) => dispatchKey("keyup", code),
    advance: (milliseconds) => { clock += milliseconds; },
    grantDeferredLock() {
      document.pointerLockElement = canvas;
      document.dispatchEvent(event("pointerlockchange"));
      resolveLock?.();
    },
    invalidations: () => invalidations,
    start: (roomId) => { controls.enter(roomId); controls.start(); },
    dispose() {
      controls.dispose();
      for (const [key, descriptor] of originalGlobals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

/** Board pixel to world metres, through the model's calibration and widening. */
function world(x, y) {
  const [nx, nz] = boardToNormalized(model, [x, y]);
  return { x: (nx - 0.5) * layout.width, z: (nz - 0.5) * layout.depth };
}

test("focused WASD moves the real camera at eye height and keyup stops movement", () => {
  const h = createHarness();
  try {
    h.start();
    assert.equal(h.states.at(-1), "drag");
    assert.equal(h.document.activeElement, h.canvas);
    assert.equal(h.canvas.tabIndex, 0);
    const before = h.camera.position.clone();
    assert.equal(h.keyDown("KeyW").defaultPrevented, true);
    assert.equal(h.controls.update(0.05), true);
    close(h.camera.position.distanceTo(before), 1.65 * 0.05);
    assert.equal(h.camera.position.y, 1.6);
    assert.ok(h.camera.position.x > before.x);
    assert.ok(h.camera.position.z < before.z);
    assert.equal(canWalkTo(layout, { x: h.camera.position.x, z: h.camera.position.z }), true);
    h.keyUp("KeyW");
    const stopped = h.camera.position.clone();
    assert.equal(h.controls.update(0.05), false);
    assert.deepEqual(h.camera.position, stopped);
    assert.ok(h.invalidations() > 0);
  } finally {
    h.dispose();
  }
});

test("touch walking skips pointer lock and the joystick walks at its tilt, then stops", () => {
  const h = createHarness();
  try {
    let lockRequests = 0;
    h.canvas.requestPointerLock = () => { lockRequests += 1; };
    h.controls.enter();
    h.controls.start({ touch: true });
    assert.equal(lockRequests, 0);
    assert.equal(h.states.at(-1), "drag");
    const before = h.camera.position.clone();
    // Half-way forward walks at half pace; past the rim is clamped to full pace.
    h.controls.setStick(0, 0.5);
    assert.equal(h.controls.update(0.05), true);
    close(h.camera.position.distanceTo(before), 1.65 * 0.05 * 0.5);
    const middle = h.camera.position.clone();
    h.controls.setStick(0, 3);
    assert.equal(h.controls.update(0.05), true);
    close(h.camera.position.distanceTo(middle), 1.65 * 0.05);
    h.controls.setStick(0, 0);
    assert.equal(h.controls.update(0.05), false);
    // Pausing drops a held joystick so the walk cannot run on by itself.
    h.controls.setStick(1, 0);
    h.controls.pause();
    assert.equal(h.controls.update(0.05), false);
  } finally {
    h.dispose();
  }
});

test("diagonal WASD is normalized and long frames do not increase the movement step", () => {
  const h = createHarness();
  try {
    h.start();
    const before = h.camera.position.clone();
    h.keyDown("KeyW");
    h.keyDown("KeyD");
    h.keyDown("ArrowUp");
    assert.equal(h.controls.update(10), true);
    close(h.camera.position.distanceTo(before), 1.65 * 0.05);
  } finally {
    h.dispose();
  }
});

test("shortcuts and input outside the active canvas do not move the walkthrough", () => {
  const h = createHarness();
  try {
    h.start();
    for (const modifier of ["ctrlKey", "metaKey", "altKey"]) {
      assert.equal(h.keyDown("KeyW", { [modifier]: true }).defaultPrevented, false);
      assert.equal(h.controls.update(0.05), false);
    }
    h.document.activeElement = new EventTarget();
    assert.equal(h.keyDown("KeyW").defaultPrevented, false);
    assert.equal(h.controls.update(0.05), false);
  } finally {
    h.dispose();
  }
});

test("leave and dispose release input and make subsequent keyboard events harmless", () => {
  const h = createHarness("granted");
  try {
    h.start();
    h.keyDown("KeyW");
    h.controls.leave();
    assert.equal(h.document.pointerLockElement, null);
    const left = h.camera.position.clone();
    assert.equal(h.keyDown("KeyW").defaultPrevented, false);
    assert.equal(h.controls.update(0.05), false);
    assert.deepEqual(h.camera.position, left);

    h.start();
    h.keyDown("KeyD");
    h.controls.dispose();
    const disposed = h.camera.position.clone();
    assert.equal(h.document.pointerLockElement, null);
    assert.equal(h.keyDown("KeyW").defaultPrevented, false);
    h.document.dispatchEvent(event("mousemove", { movementX: 100, movementY: 100 }));
    assert.equal(h.controls.update(0.05), false);
    assert.deepEqual(h.camera.position, disposed);
  } finally {
    h.dispose();
  }
});

test("the first Escape pauses walking and prevents the same key from closing the dialog", () => {
  const h = createHarness("granted");
  try {
    h.start();
    h.keyDown("KeyW");
    const escape = h.keyDown("Escape");
    assert.equal(escape.defaultPrevented, true);
    assert.equal(h.states.at(-1), "paused");
    assert.equal(h.document.pointerLockElement, null);
    assert.equal(h.controls.update(0.05), false);
    const firstCancel = event("cancel");
    h.dialog.dispatchEvent(firstCancel);
    assert.equal(firstCancel.defaultPrevented, true);

    h.advance(351);
    const laterCancel = event("cancel");
    h.dialog.dispatchEvent(laterCancel);
    assert.equal(laterCancel.defaultPrevented, false, "A later Escape can close the paused dialog");
  } finally {
    h.dispose();
  }
});

test("native pointer-lock escape also pauses before a dialog cancel reaches its owner", () => {
  const h = createHarness("granted");
  try {
    h.start();
    h.document.exitPointerLock();
    assert.equal(h.states.at(-1), "paused");
    const cancel = event("cancel");
    h.dialog.dispatchEvent(cancel);
    assert.equal(cancel.defaultPrevented, true);
    assert.equal(h.controls.update(0.05), false);
  } finally {
    h.dispose();
  }
});

for (const action of ["pause", "leave", "dispose"]) {
  test(`a deferred pointer-lock grant after ${action} cannot recapture the mouse`, async () => {
    const h = createHarness("deferred");
    try {
      h.start();
      h.controls[action]();
      const stopped = h.camera.position.clone();
      h.grantDeferredLock();
      await Promise.resolve();
      assert.equal(h.document.pointerLockElement === null, true, `Late grant after ${action} releases the mouse`);
      assert.equal(h.states.includes("walking"), false, `Late grant after ${action} never resumes walking`);
      assert.equal(h.keyDown("KeyW").defaultPrevented, false);
      assert.equal(h.controls.update(0.05), false);
      assert.deepEqual(h.camera.position, stopped);
    } finally {
      h.dispose();
    }
  });
}

test("pointer-lock failures keep focused keyboard movement and drag-to-look available", async () => {
  for (const mode of ["unavailable", "throws", "rejects"]) {
    const h = createHarness(mode);
    try {
      h.start();
      await Promise.resolve();
      assert.equal(h.states.at(-1), "drag", mode);
      const yaw = h.camera.rotation.y;
      h.canvas.dispatchEvent(event("pointerdown", {
        button: 0, pointerId: 5, clientX: 100, clientY: 100,
      }));
      assert.equal(h.captures.has(5), true);
      h.advance(100);
      h.canvas.dispatchEvent(event("pointermove", {
        pointerId: 5, clientX: 160, clientY: 80,
      }));
      close(h.camera.rotation.y, yaw - 60 * 0.0026);
      close(h.camera.rotation.x, -0.04 + 20 * 0.0026);
      assert.equal(h.camera.rotation.order, "YXZ");
      close(h.poses.at(-1).yaw, h.camera.rotation.y);
      h.canvas.dispatchEvent(event("pointerup", { pointerId: 5 }));
      assert.equal(h.captures.has(5), false);
      const released = h.camera.rotation.toArray();
      h.canvas.dispatchEvent(event("pointermove", {
        pointerId: 5, clientX: 250, clientY: 200,
      }));
      assert.deepEqual(h.camera.rotation.toArray(), released);
      h.keyDown("KeyW");
      assert.equal(h.controls.update(0.05), true);
    } finally {
      h.dispose();
    }
  }
});

test("locked mouse-look rotates the real camera and publishes normalized orientation-map poses", () => {
  const h = createHarness("granted");
  try {
    h.start();
    assert.equal(h.states.at(-1), "walking");
    const yaw = h.camera.rotation.y;
    h.advance(100);
    h.document.dispatchEvent(event("mousemove", { movementX: 50, movementY: -25 }));
    close(h.camera.rotation.y, yaw - 0.1);
    close(h.camera.rotation.x, 0.01);
    h.keyDown("KeyW");
    h.advance(100);
    h.controls.update(0.05);
    const pose = h.poses.at(-1);
    close(pose.x, h.camera.position.x / layout.width + 0.5);
    close(pose.y, h.camera.position.z / layout.depth + 0.5);
    close(pose.yaw, h.camera.rotation.y);
    assert.ok(pose.x >= 0 && pose.x <= 1 && pose.y >= 0 && pose.y <= 1);
    h.document.dispatchEvent(event("mousemove", { movementX: 0, movementY: -100000 }));
    close(h.camera.rotation.x, 1.15, 1e-6);
  } finally {
    h.dispose();
  }
});

test("real controls pass through the bedroom doorway and stop at its solid partition", () => {
  const h = createHarness("granted");
  try {
    h.start();
    const doorStart = world(430, 760);
    h.camera.position.set(doorStart.x, 1.6, doorStart.z);
    h.document.dispatchEvent(event("mousemove", {
      movementX: (h.camera.rotation.y - Math.PI / 2) / 0.002,
      movementY: 0,
    }));
    h.keyDown("KeyW");
    for (let frame = 0; frame < 15; frame += 1) h.controls.update(0.05);
    assert.ok(h.camera.position.x < world(372, 760).x, "The camera entered the bedroom");
    assert.equal(canWalkTo(layout, { x: h.camera.position.x, z: h.camera.position.z }), true);
    h.keyUp("KeyW");

    const wallStart = world(300, 380);
    h.camera.position.set(wallStart.x, 1.6, wallStart.z);
    h.document.dispatchEvent(event("mousemove", {
      movementX: (h.camera.rotation.y - Math.PI) / 0.002,
      movementY: 0,
    }));
    h.keyDown("KeyW");
    for (let frame = 0; frame < 120; frame += 1) h.controls.update(0.05);
    assert.ok(h.camera.position.z < world(300, 429).z - 0.16);
    assert.ok(h.camera.position.z > wallStart.z);
    assert.equal(canWalkTo(layout, { x: h.camera.position.x, z: h.camera.position.z }), true);
  } finally {
    h.dispose();
  }
});

test("losing focus or hiding the document pauses movement and releases captured pointers", () => {
  const h = createHarness();
  try {
    h.start();
    h.keyDown("KeyW");
    h.canvas.dispatchEvent(event("pointerdown", {
      button: 0, pointerId: 7, clientX: 100, clientY: 100,
    }));
    h.window.dispatchEvent(event("blur"));
    assert.equal(h.states.at(-1), "paused");
    assert.equal(h.captures.size, 0);
    assert.equal(h.controls.update(0.05), false);

    h.controls.start();
    h.keyDown("KeyW");
    h.document.hidden = true;
    h.document.dispatchEvent(event("visibilitychange"));
    assert.equal(h.states.at(-1), "paused");
    assert.equal(h.controls.update(0.05), false);

    h.document.hidden = false;
    h.controls.start();
    h.keyDown("KeyW");
    h.canvas.dispatchEvent(event("blur", { relatedTarget: new EventTarget() }));
    assert.equal(h.states.at(-1), "paused");
    assert.equal(h.controls.update(0.05), false);
  } finally {
    h.dispose();
  }
});
