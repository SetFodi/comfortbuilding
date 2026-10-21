import * as THREE from "three";
import type { ApartmentModel } from "@/lib/apartment-model";
import { createWalkthroughLayout, moveWalkthrough, walkthroughSpawn } from "@/lib/apartment-walkthrough";

export type WalkthroughState = "ready" | "walking" | "drag" | "paused";
export interface WalkthroughPose {
  /** Normalized plan coordinates, also used by the visible orientation map. */
  x: number;
  y: number;
  yaw: number;
}

/** Owns input only while this canvas is active. No global shortcuts survive dispose. */
export function createWalkthroughControls(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  model: ApartmentModel,
  invalidate: () => void,
  onState: (state: WalkthroughState) => void,
  onPose: (pose: WalkthroughPose) => void,
) {
  const layout = createWalkthroughLayout(model);
  const keys = new Set<string>();
  const movementKeys = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
  let enabled = false;
  let active = false;
  let disposed = false;
  let locked = false;
  let dragging = false;
  let pointerId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let yaw = 0;
  let pitch = 0;
  let lastPose = 0;
  let escapeAt = -Infinity;
  let lockRequest = 0;
  // On-screen joystick: x to the right, y forward, each in [-1, 1].
  const stick = { x: 0, y: 0 };
  let touching = false;
  const dialog = canvas.closest("dialog");
  canvas.tabIndex = 0;
  // Fingers look around the room instead of scrolling the page.
  canvas.style.touchAction = "none";

  function reportPose(force = false) {
    const now = performance.now();
    if (!force && now - lastPose < 80) return;
    lastPose = now;
    onPose({
      x: camera.position.x / layout.width + 0.5,
      y: camera.position.z / layout.depth + 0.5,
      yaw,
    });
  }

  function orient() {
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    reportPose();
    invalidate();
  }

  function pause() {
    lockRequest += 1;
    active = false;
    dragging = false;
    keys.clear();
    stick.x = stick.y = 0;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    pointerId = null;
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    if (enabled && !disposed) onState("paused");
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!enabled || !active) return;
    if (event.code === "Escape") {
      escapeAt = performance.now();
      event.preventDefault();
      event.stopPropagation();
      pause();
      return;
    }
    if (!movementKeys.has(event.code) || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!locked && document.activeElement !== canvas) return;
    event.preventDefault();
    keys.add(event.code);
    invalidate();
  }

  function onKeyUp(event: KeyboardEvent) {
    keys.delete(event.code);
  }

  function onPointerDown(event: PointerEvent) {
    touching = event.pointerType === "touch";
    if (!enabled || !active || locked || event.button !== 0 || dragging) return;
    canvas.focus({ preventScroll: true });
    dragging = true;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!enabled || !active || locked || !dragging || event.pointerId !== pointerId) return;
    // A finger covers less ground than a mouse, so it turns a little faster.
    const speed = event.pointerType === "touch" ? 0.0042 : 0.0026;
    yaw -= (event.clientX - lastX) * speed;
    pitch = THREE.MathUtils.clamp(pitch - (event.clientY - lastY) * speed, -1.15, 1.15);
    lastX = event.clientX;
    lastY = event.clientY;
    orient();
  }

  function onPointerUp(event: PointerEvent) {
    if (pointerId !== null && event.pointerId !== pointerId) return;
    dragging = false;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    pointerId = null;
  }

  function onMouseMove(event: MouseEvent) {
    if (!enabled || !active || !locked) return;
    yaw -= event.movementX * 0.002;
    pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.002, -1.15, 1.15);
    orient();
  }

  function onLockChange() {
    const wasLocked = locked;
    locked = document.pointerLockElement === canvas;
    if (locked && (!enabled || !active || disposed)) {
      document.exitPointerLock();
      return;
    }
    if (!enabled || disposed) return;
    if (locked) {
      active = true;
      onState("walking");
    } else if (wasLocked) {
      escapeAt = performance.now();
      pause();
    }
  }

  function onLockError() {
    if (enabled && active && !disposed) onState("drag");
  }

  function onBlur() {
    if (enabled && active) pause();
  }

  function onVisibility() {
    if (document.hidden) onBlur();
  }

  function onFocusOut(event: FocusEvent) {
    // A touch on the joystick moves focus off the canvas; that is not leaving.
    if (touching) return;
    if (enabled && active && !locked && event.relatedTarget !== canvas) pause();
  }

  function onDialogCancel(event: Event) {
    // The first Escape leaves mouse-look; it must not also dismiss the apartment.
    if (enabled && (active || performance.now() - escapeAt < 350)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      escapeAt = performance.now();
      pause();
    }
  }

  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("pointerlockchange", onLockChange);
  document.addEventListener("pointerlockerror", onLockError);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("blur", onFocusOut);
  dialog?.addEventListener("cancel", onDialogCancel, true);

  return {
    enter(roomId?: string) {
      pause();
      enabled = true;
      const spawn = walkthroughSpawn(model, roomId);
      camera.position.set(spawn.position.x, 1.6, spawn.position.z);
      yaw = Math.atan2(-(spawn.target.x - spawn.position.x), -(spawn.target.z - spawn.position.z));
      pitch = -0.04;
      orient();
      reportPose(true);
      onState("ready");
    },
    start(options: { touch?: boolean } = {}) {
      if (!enabled || disposed) return;
      canvas.focus({ preventScroll: true });
      active = true;
      onState("drag");
      // Touch screens look by dragging and move with the joystick.
      touching = Boolean(options.touch);
      if (touching) {
        invalidate();
        return;
      }
      const requestId = ++lockRequest;
      try {
        // Browsers without pointer lock still support focused WASD + drag-to-look.
        const request = canvas.requestPointerLock?.();
        if (request && typeof request.then === "function") {
          request.then(() => {
            if ((disposed || !enabled || !active || requestId !== lockRequest) && document.pointerLockElement === canvas) {
              document.exitPointerLock();
            }
          }).catch(() => {
            if (requestId === lockRequest) onLockError();
          });
        }
      } catch {
        onLockError();
      }
      invalidate();
    },
    leave() {
      enabled = false;
      pause();
    },
    pause,
    /** Joystick input: x to the right and y forward, clamped to the unit circle. */
    setStick(x: number, y: number) {
      const length = Math.hypot(x, y);
      const scale = length > 1 ? 1 / length : 1;
      stick.x = enabled && active ? x * scale : 0;
      stick.y = enabled && active ? y * scale : 0;
      invalidate();
    },
    /** True while the visitor is walking (pointer locked or focused drag mode). */
    isActive() {
      return enabled && active && !disposed;
    },
    update(deltaSeconds: number) {
      if (!enabled || !active || (keys.size === 0 && !stick.x && !stick.y)) return false;
      const forward = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown")) + stick.y;
      const right = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft")) + stick.x;
      const magnitude = Math.hypot(forward, right);
      if (magnitude < 0.05) return false;
      // Keys walk at full pace; a joystick held part way walks slower.
      const distance = Math.min(deltaSeconds, 0.05) * 1.65 * Math.min(1, magnitude) / magnitude;
      const next = moveWalkthrough(layout, { x: camera.position.x, z: camera.position.z }, {
        x: (-Math.sin(yaw) * forward + Math.cos(yaw) * right) * distance,
        z: (-Math.cos(yaw) * forward - Math.sin(yaw) * right) * distance,
      });
      camera.position.x = next.x;
      camera.position.z = next.z;
      camera.position.y = 1.6;
      reportPose();
      return true;
    },
    dispose() {
      disposed = true;
      enabled = false;
      pause();
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("blur", onFocusOut);
      dialog?.removeEventListener("cancel", onDialogCancel, true);
    },
  };
}
