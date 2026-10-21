import * as THREE from "three";

const WIDTH = 640;
const HEIGHT = 360;
const LOGO_SRC = "/images/logo-mark.png";

/** Ease out, then settle: 0 → 1 over `t` in [0, 1]. */
const easeOut = (t: number) => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3;

interface Mote {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
}

/**
 * The walkthrough TV's one channel: a CRT-style power-on, then the Comfort
 * Building monogram revealed along its own arc, a gold light sweep, the
 * wordmark, and slow brass dust while it idles.
 */
export function createTvChannel() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("TV canvas is unavailable");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  // The logo and its light sweep are composed off-screen so the sweep only
  // touches the gold strokes.
  const glint = document.createElement("canvas");
  glint.width = glint.height = 220;
  const glintContext = glint.getContext("2d");
  const logo = new Image();
  let logoReady = false;
  logo.onload = () => { logoReady = true; };
  logo.src = LOGO_SRC;

  let seed = 2026;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const motes: Mote[] = Array.from({ length: 34 }, () => ({
    x: random() * WIDTH,
    y: random() * HEIGHT,
    speed: 6 + random() * 14,
    size: 0.6 + random() * 1.6,
    phase: random() * Math.PI * 2,
  }));

  let startedAt = 0;

  function background(time: number) {
    const gradient = context!.createRadialGradient(WIDTH / 2, HEIGHT * 0.45, 10, WIDTH / 2, HEIGHT * 0.5, WIDTH * 0.62);
    const breathe = 0.5 + Math.sin(time * 0.9) * 0.5;
    gradient.addColorStop(0, `rgba(58, 48, 32, ${0.9 + breathe * 0.1})`);
    gradient.addColorStop(0.55, "#16161a");
    gradient.addColorStop(1, "#08090b");
    context!.fillStyle = gradient;
    context!.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function dust(time: number, strength: number) {
    for (const mote of motes) {
      const y = (mote.y - time * mote.speed) % HEIGHT;
      const top = y < 0 ? y + HEIGHT : y;
      const flicker = 0.35 + Math.sin(time * 1.7 + mote.phase) * 0.25;
      context!.fillStyle = `rgba(223, 197, 140, ${flicker * strength})`;
      context!.beginPath();
      context!.arc(mote.x + Math.sin(time * 0.6 + mote.phase) * 6, top, mote.size, 0, Math.PI * 2);
      context!.fill();
    }
  }

  function monogram(elapsed: number, time: number) {
    if (!logoReady || !glintContext) return;
    const size = 168;
    const cx = WIDTH / 2;
    const cy = HEIGHT * 0.42;
    const reveal = easeOut((elapsed - 0.45) / 1.15);
    if (reveal <= 0) return;
    const scale = 0.92 + reveal * 0.08;

    glintContext.clearRect(0, 0, glint.width, glint.height);
    glintContext.save();
    // Draw the mark along the sweep of its "C", like a pen tracing it.
    glintContext.beginPath();
    glintContext.moveTo(glint.width / 2, glint.height / 2);
    glintContext.arc(glint.width / 2, glint.height / 2, glint.width, -Math.PI * 0.3, -Math.PI * 0.3 + reveal * Math.PI * 2);
    glintContext.closePath();
    glintContext.clip();
    glintContext.drawImage(logo, (glint.width - size) / 2, (glint.height - size) / 2, size, size);
    glintContext.restore();

    // A light band crosses the gold once on arrival, then every few seconds.
    const cycle = elapsed < 2.4 ? (elapsed - 1.2) / 1.1 : ((time % 5.5) - 4.2) / 1.1;
    if (cycle > 0 && cycle < 1) {
      const x = -80 + cycle * (glint.width + 160);
      const band = glintContext.createLinearGradient(x - 50, 0, x + 50, glint.height);
      band.addColorStop(0, "rgba(255, 248, 225, 0)");
      band.addColorStop(0.5, "rgba(255, 248, 225, 0.85)");
      band.addColorStop(1, "rgba(255, 248, 225, 0)");
      glintContext.save();
      glintContext.globalCompositeOperation = "source-atop";
      glintContext.fillStyle = band;
      glintContext.fillRect(0, 0, glint.width, glint.height);
      glintContext.restore();
    }

    context!.save();
    context!.globalAlpha = reveal;
    context!.shadowColor = "rgba(223, 197, 140, 0.55)";
    context!.shadowBlur = 18 + Math.sin(time * 1.3) * 6;
    const drawn = glint.width * scale;
    context!.drawImage(glint, cx - drawn / 2, cy - drawn / 2, drawn, drawn);
    context!.restore();
  }

  function wordmark(elapsed: number) {
    const appear = easeOut((elapsed - 1.35) / 0.9);
    if (appear <= 0) return;
    const y = HEIGHT * 0.79;
    context!.save();
    context!.textAlign = "center";
    context!.textBaseline = "middle";
    context!.fillStyle = `rgba(243, 240, 233, ${appear})`;
    context!.font = "500 24px Georgia, 'Times New Roman', serif";
    // Letters gather from wide to settled spacing as they fade in.
    const letters = "COMFORT BUILDING".split("");
    const spacing = 9 + (1 - appear) * 10;
    const widths = letters.map((letter) => context!.measureText(letter).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + spacing * (letters.length - 1);
    let x = WIDTH / 2 - total / 2;
    letters.forEach((letter, index) => {
      context!.fillText(letter, x + widths[index] / 2, y);
      x += widths[index] + spacing;
    });
    const line = easeOut((elapsed - 1.7) / 0.8) * 150;
    context!.fillStyle = "rgba(197, 170, 114, 0.9)";
    context!.fillRect(WIDTH / 2 - line / 2, y + 24, line, 1.5);
    context!.restore();
  }

  function powerOn(elapsed: number) {
    // The picture opens from a bright line, as a tube set would.
    if (elapsed >= 0.42) return;
    const open = easeOut(elapsed / 0.42);
    const lineWidth = WIDTH * Math.min(1, elapsed / 0.16);
    const height = Math.max(2, HEIGHT * Math.max(0, (elapsed - 0.14) / 0.28) * open);
    context!.fillStyle = "#000";
    context!.fillRect(0, 0, WIDTH, (HEIGHT - height) / 2);
    context!.fillRect(0, (HEIGHT + height) / 2, WIDTH, (HEIGHT - height) / 2);
    context!.fillStyle = `rgba(255, 246, 222, ${1 - open * 0.85})`;
    context!.fillRect((WIDTH - lineWidth) / 2, HEIGHT / 2 - height / 2, lineWidth, height);
  }

  function scanlines() {
    context!.fillStyle = "rgba(0, 0, 0, 0.08)";
    for (let y = 0; y < HEIGHT; y += 3) context!.fillRect(0, y, WIDTH, 1);
  }

  return {
    texture,
    start(now: number) {
      startedAt = now;
    },
    /** Redraws the frame for `now` (ms, performance clock). */
    update(now: number) {
      const elapsed = (now - startedAt) / 1000;
      const time = now / 1000;
      background(time);
      dust(time, easeOut((elapsed - 0.8) / 1.5));
      monogram(elapsed, time);
      wordmark(elapsed);
      scanlines();
      powerOn(elapsed);
      texture.needsUpdate = true;
    },
    dispose() {
      texture.dispose();
      logo.onload = null;
    },
  };
}

export type TvChannel = ReturnType<typeof createTvChannel>;
