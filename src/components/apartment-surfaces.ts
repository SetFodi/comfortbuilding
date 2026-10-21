import * as THREE from "three";

export type TextureKind = "floorOak" | "oak" | "linen" | "plaster" | "stone" | "rug" | "metal" | "tile";

/** Color, height and roughness maps generated per pixel, tiling seamlessly. */
export function textureMaps(kind: TextureKind) {
  const size = kind === "floorOak" ? 1024 : 512;
  const canvases = Array.from({ length: 3 }, () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Interior texture canvas is unavailable");
    return { canvas, context, pixels: context.createImageData(size, size) };
  });
  const base = {
    floorOak: [201, 187, 165], oak: [205, 192, 172], linen: [246, 244, 239],
    plaster: [250, 248, 244], stone: [223, 214, 199], rug: [238, 231, 220],
    metal: [255, 255, 255], tile: [226, 219, 208],
  }[kind];
  const boardJoints = [0.13, 0.57, 0.86, 0.32, 0.71, 0.44];
  let seed = 4650;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const noise = random() - 0.5;
      let color = noise * 2;
      let height = noise * 16;
      let roughness = 235 + noise * 12;
      if (kind === "oak" || kind === "floorOak") {
        const board = kind === "floorOak" ? Math.min(5, Math.floor(u * 6)) : 0;
        const localU = kind === "floorOak" ? (u * 6) % 1 : u;
        const warp = Math.sin(v * Math.PI * 2 + board) * 0.8 + Math.sin(v * Math.PI * 6 + board * 2) * 0.25;
        const grain = Math.sin(localU * 150 + warp * 2.4 + Math.sin(localU * 21 + v * Math.PI * 2));
        const fineGrain = Math.sin(localU * 385 + warp * 4);
        const growth = Math.sin(localU * 26 + warp * 1.4) * 2.2;
        const pore = grain > 0.88 && fineGrain > 0.25 ? (grain - 0.88) * 42 : 0;
        const boardTone = kind === "floorOak" ? Math.sin(board * 3.17) * 4 : 0;
        color = grain * 2.7 + fineGrain * 0.8 + growth + noise * 2 + boardTone - pore;
        height = grain * 12 + fineGrain * 3 + noise * 5 - pore * 5;
        roughness = 229 + grain * 12 + noise * 5;
        if (kind === "floorOak") {
          const edge = Math.min(localU, 1 - localU);
          const joint = Math.abs(v - boardJoints[board]);
          if (edge < 0.006 || joint < 0.0012) {
            color -= 25;
            height = -65;
            roughness = 252;
          }
        }
      } else if (kind === "linen" || kind === "rug") {
        const pitch = kind === "rug" ? 8 : 6;
        const warp = Math.cos(x / pitch * Math.PI * 2);
        const weft = Math.cos(y / pitch * Math.PI * 2);
        const overUnder = (Math.floor(x / pitch) + Math.floor(y / pitch)) % 2 ? warp : weft;
        color = (warp + weft) * 1.1 + overUnder * 0.7 + noise * 3;
        height = (warp + weft) * 16 + overUnder * 12 + noise * 5;
        roughness = 243 + noise * 10;
      } else if (kind === "stone") {
        const cloud = Math.sin(u * Math.PI * 6 + Math.cos(v * Math.PI * 4))
          + Math.sin(v * Math.PI * 8 + Math.sin(u * Math.PI * 2)) * 0.6;
        const pores = noise < -0.485 ? -9 : 0;
        color = cloud * 2.4 + noise * 3 + pores;
        height = cloud * 4 + noise * 14 + pores * 3;
        roughness = 228 + cloud * 7 + noise * 10;
      } else if (kind === "tile") {
        // A 4 × 4 grid of honed tiles with recessed grout joints.
        const tileU = (u * 4) % 1;
        const tileV = (v * 4) % 1;
        const joint = Math.min(tileU, 1 - tileU, tileV, 1 - tileV);
        const cloud = Math.sin(u * Math.PI * 10 + Math.cos(v * Math.PI * 6)) * 0.8;
        const shade = Math.sin(Math.floor(u * 4) * 3.1 + Math.floor(v * 4) * 1.7) * 2.5;
        color = cloud + shade + noise * 3;
        height = cloud * 3 + noise * 6;
        roughness = 214 + cloud * 6 + noise * 8;
        if (joint < 0.012) {
          color -= 34;
          height = -70;
          roughness = 252;
        }
      } else if (kind === "metal") {
        color = 0;
        height = Math.sin(y * 1.77) * 17 + noise * 4;
        roughness = 208 + Math.sin(y * 1.77) * 15 + noise * 9;
      }
      const index = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        canvases[0].pixels.data[index + channel] = base[channel] + color;
        canvases[1].pixels.data[index + channel] = 128 + height;
        canvases[2].pixels.data[index + channel] = roughness;
      }
      canvases[0].pixels.data[index + 3] = 255;
      canvases[1].pixels.data[index + 3] = 255;
      canvases[2].pixels.data[index + 3] = 255;
    }
  }
  const textures = canvases.map(({ canvas, context, pixels }, index) => {
    context.putImageData(pixels, 0, 0);
    const result = new THREE.CanvasTexture(canvas);
    // Height and roughness are linear data, not the tinted color image.
    result.colorSpace = index === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    result.anisotropy = 8;
    return result;
  });
  return { map: textures[0], bumpMap: textures[1], roughnessMap: textures[2] };
}

/** Soft sky-to-ground gradient seen through the windows. */
export function daylightTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Interior texture canvas is unavailable");
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#b9cdcc");
  gradient.addColorStop(0.5, "#d8dfd5");
  gradient.addColorStop(1, "#eee6d6");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  return result;
}

/**
 * Rewrites box-projected UVs in metres so plank widths, tile joints and fabric
 * threads keep one real scale across differently sized pieces.
 */
export function applyMetricUVs(geometry: THREE.BufferGeometry, material: THREE.Material) {
  const textureMetres = material.userData.textureMetres as readonly [number, number] | undefined;
  if (!textureMetres) return;
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  if (!positions || !normals || !uv) return;
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    const nx = Math.abs(normals.getX(vertex));
    const ny = Math.abs(normals.getY(vertex));
    const nz = Math.abs(normals.getZ(vertex));
    const u = nx > ny && nx > nz ? positions.getZ(vertex) : positions.getX(vertex);
    const v = ny >= nx && ny >= nz ? positions.getZ(vertex) : positions.getY(vertex);
    uv.setXY(vertex, u / textureMetres[0], v / textureMetres[1]);
  }
  uv.needsUpdate = true;
}
