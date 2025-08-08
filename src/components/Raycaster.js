import { Raycaster as ThreeRaycaster, Vector2 } from 'three'

export class Raycaster {
  #raycaster;
  #pointer;
  #camera;
  #scene;

  constructor(camera, scene) {
    this.#camera = camera
    this.#scene = scene
    this.#raycaster = new ThreeRaycaster()
    this.#pointer = new Vector2()
  }

  updatePointer(normalizedMouse) {
    this.#pointer.copy(normalizedMouse)
  }

  checkIntersections(targetObjects = []) {
    this.#raycaster.setFromCamera(this.#pointer, this.#camera)
    const intersects = this.#raycaster.intersectObjects(targetObjects, true)
    return intersects
  }

  getFirstIntersection(targetObjects = []) {
    const intersects = this.checkIntersections(targetObjects)
    return intersects.length > 0 ? intersects[0] : null
  }
}
