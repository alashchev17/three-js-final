import * as THREE from 'three'
import vertexShader from '../shaders/interactive/index.vert?raw'
import fragmentShader from '../shaders/interactive/index.frag?raw'

export class InteractivePlane {
  #uniforms
  #material
  #previousMouse = new THREE.Vector2(0, 0)
  #mouseVelocity = 0

  constructor(textures, noiseTexture) {
    this.#createMaterial(textures, noiseTexture)
    this.#createMesh()
  }

  #createMaterial(textures, noiseTexture) {
    // Ensure textures exist
    const textureA = textures[0] || new THREE.Texture()
    const textureB = textures[1] || new THREE.Texture()
    const noise = noiseTexture || new THREE.Texture()

    this.#uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uIntersectionUV: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVelocity: { value: 0 },
      uIsIntersecting: { value: 0 },
      uTextureA: { value: textureA },
      uTextureB: { value: textureB },
      uNoise: { value: noise },
    }

    this.#material = new THREE.ShaderMaterial({
      uniforms: this.#uniforms,
      vertexShader,
      fragmentShader,
      transparent: false,
      side: THREE.DoubleSide,
    })
  }

  #createMesh() {
    const geometry = new THREE.PlaneGeometry(1.4, 1.0)
    this.mesh = new THREE.Mesh(geometry, this.#material)
    this.mesh.castShadow = false
    this.mesh.receiveShadow = false
  }

  update(time) {
    this.#uniforms.uTime.value = time

    // Decay velocity when mouse stops moving
    this.#mouseVelocity *= 0.9
    this.#uniforms.uMouseVelocity.value = this.#mouseVelocity
  }

  updateMouse(mouse) {
    const deltaX = mouse.x - this.#previousMouse.x
    const deltaY = mouse.y - this.#previousMouse.y
    const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10

    this.#mouseVelocity = Math.max(speed, this.#mouseVelocity)

    this.#previousMouse.copy(mouse)
    this.#uniforms.uMouse.value.copy(mouse)
  }

  updateIntersection(intersection) {
    if (intersection) {
      const uv = intersection.uv
      if (uv) {
        this.#uniforms.uIntersectionUV.value.copy(uv)
        this.#uniforms.uIsIntersecting.value = 1.0
      }
    } else {
      this.#uniforms.uIsIntersecting.value = 0.0
    }
  }
}
