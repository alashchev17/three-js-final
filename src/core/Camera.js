import { PerspectiveCamera } from 'three'
import { gsap } from 'gsap'

export class Camera {
  #originalPosition
  #originalRotation

  constructor() {
    this.instance = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)

    this.instance.position.set(0, 1.5, 35)
    this.#originalPosition = this.instance.position.clone()
    this.#originalRotation = this.instance.rotation.clone()
  }

  updateFromMouse(mouse) {
    // Subtle camera tilt and movement based on mouse
    const tiltX = mouse.y * 0.05
    const tiltY = mouse.x * 0.05
    const offsetX = mouse.x * 0.1
    const offsetY = mouse.y * 0.1

    gsap.to(this.instance.rotation, {
      x: this.#originalRotation.x + tiltX,
      y: this.#originalRotation.y + tiltY,
      duration: 1,
      ease: 'power2.out',
    })

    gsap.to(this.instance.position, {
      x: this.#originalPosition.x + offsetX,
      y: this.#originalPosition.y + offsetY,
      duration: 1,
      ease: 'power2.out',
    })
  }

  updateAspect() {
    this.instance.aspect = window.innerWidth / window.innerHeight
    this.instance.updateProjectionMatrix()
  }
}
