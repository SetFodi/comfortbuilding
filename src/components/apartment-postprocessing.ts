import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

export interface ApartmentPostprocessing {
  render: (delta: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

class InteriorOcclusionPass extends GTAOPass {
  override render(...args: Parameters<GTAOPass["render"]>) {
    const visibility = new Map<THREE.Object3D, boolean>();
    const overrideMaterial = this.scene.overrideMaterial;
    this.scene.traverse((object) => {
      visibility.set(object, object.visible);
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (!materials.some((material) => material.transparent || !material.depthWrite
        || (material as THREE.MeshBasicMaterial).isMeshBasicMaterial)) return;
      mesh.visible = false;
    });
    try {
      super.render(...args);
    } finally {
      visibility.forEach((visible, object) => { object.visible = visible; });
      this.scene.overrideMaterial = overrideMaterial;
    }
  }
}

/** Owns the walkthrough's color output and contact shadows, not scene geometry. */
export function createApartmentPostprocessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): ApartmentPostprocessing {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 });
  const composer = new EffectComposer(renderer, target);
  // Supply bounded physical dimensions ourselves, without changing the
  // renderer's pixel ratio for the apartment's ordinary 3D views.
  composer.setPixelRatio(1);
  const occlusion = new InteriorOcclusionPass(scene, camera, 1, 1);
  const output = new OutputPass();
  const antialias = new ShaderPass(FXAAShader);
  antialias.material.toneMapped = false;
  antialias.uniforms.resolution.value.set(1, 1);
  occlusion.output = GTAOPass.OUTPUT.Default;
  occlusion.blendIntensity = 0.6;
  occlusion.updateGtaoMaterial({ radius: 0.18, distanceExponent: 1, thickness: 0.5, scale: 1, samples: 16 });
  occlusion.updatePdMaterial({ lumaPhi: 10, depthPhi: 4, normalPhi: 6, radius: 6, rings: 2, samples: 16 });
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(occlusion);
  composer.addPass(output);
  // FXAA measures contrast in the display-space image, after tone mapping.
  composer.addPass(antialias);
  let disposed = false;

  return {
    render(delta) {
      if (disposed) return;
      const previousTarget = renderer.getRenderTarget();
      const previousClearColor = renderer.getClearColor(new THREE.Color());
      const previousClearAlpha = renderer.getClearAlpha();
      const previousAutoClear = renderer.autoClear;
      try {
        composer.render(delta);
      } finally {
        renderer.setRenderTarget(previousTarget);
        renderer.setClearColor(previousClearColor, previousClearAlpha);
        renderer.autoClear = previousAutoClear;
      }
    },
    resize(width, height) {
      if (disposed || !Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) return;
      const ratio = Math.min(renderer.getPixelRatio(), 1.5, Math.sqrt(2_000_000 / (width * height)));
      const pixelWidth = Math.max(1, Math.floor(width * ratio));
      const pixelHeight = Math.max(1, Math.floor(height * ratio));
      composer.setSize(pixelWidth, pixelHeight);
      antialias.uniforms.resolution.value.set(1 / pixelWidth, 1 / pixelHeight);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      occlusion.dispose();
      // Three r186's GTAOPass omits these two owned shader materials.
      occlusion.gtaoMaterial.dispose();
      occlusion.blendMaterial.dispose();
      output.dispose();
      antialias.dispose();
      composer.dispose();
      composer.timer.dispose();
    },
  };
}
