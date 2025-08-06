import * as THREE from 'three'

export class Frame {
  #gltf

  constructor(gltf) {
    this.#gltf = gltf
    this.group = this.#gltf.scene
    this.#setup()
  }

  #setup() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = false

        child.material = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.8,
          metalness: 0.1,
        })
      }
    })

    this.group.rotation.set(0, 4.69752172161341, 0)
    this.group.scale.set(0.04, 0.04, 0.04)
    this.group.position.set(4, -3.4, 0)
  }
}
