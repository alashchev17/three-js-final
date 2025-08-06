import * as THREE from 'three';

export class Renderer {
  constructor(canvas) {
    this.instance = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });

    this.#configure();
    this.updateSize();
  }

  #configure() {
    this.instance.physicallyCorrectLights = true;
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1;
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  updateSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.instance.setSize(width, height);
  }

  render(scene, camera) {
    this.instance.render(scene, camera);
  }
}
