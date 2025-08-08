import { MeshStandardMaterial, FrontSide } from 'three'

export class Wall {
  #gltf

  constructor(gltf) {
    this.#gltf = gltf
    this.group = this.#gltf.scene
    this.#setup()
  }

  #setup() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false
        child.receiveShadow = true

        child.material = new MeshStandardMaterial({
          color: 0x777777,
          roughness: 0.9,
          metalness: 0.1,
          side: FrontSide,
        })
      }
    })
  }
}
