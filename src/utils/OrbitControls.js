import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class OrbitControlsWrapper {
  #controls;
  #enabled = false;

  constructor(camera, canvas) {
    this.#controls = new OrbitControls(camera, canvas);
    this.#controls.enableDamping = true;
    this.#controls.dampingFactor = 0.05;
    this.#controls.enabled = false;
  }

  enable() {
    this.#enabled = true;
    this.#controls.enabled = true;
  }

  disable() {
    this.#enabled = false;
    this.#controls.enabled = false;
  }

  update() {
    if (this.#enabled) {
      this.#controls.update();
    }
  }

  get enabled() {
    return this.#enabled;
  }
}
