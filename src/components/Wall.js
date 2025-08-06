import * as THREE from 'three';

export class Wall {
  #gltf;

  constructor(gltf) {
    this.#gltf = gltf;
    this.group = this.#gltf.scene;
    this.#setup();
  }

  #setup() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
        child.material.side = THREE.FrontSide;
      }
    });
  }
}
