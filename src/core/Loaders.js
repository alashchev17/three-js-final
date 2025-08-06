import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import * as THREE from 'three'

export class Loaders {
  #gltfLoader
  #textureLoader
  #exrLoader

  constructor() {
    this.#setupLoaders()
  }

  #setupLoaders() {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')

    this.#gltfLoader = new GLTFLoader()
    this.#gltfLoader.setDRACOLoader(dracoLoader)

    this.#textureLoader = new THREE.TextureLoader()

    this.#exrLoader = new EXRLoader()
  }

  async loadGLTF(url) {
    return new Promise((resolve, reject) => {
      this.#gltfLoader.load(url, resolve, undefined, reject)
    })
  }

  async loadTexture(url) {
    return new Promise((resolve, reject) => {
      console.log('Loading texture:', url)
      this.#textureLoader.load(
        url,
        (texture) => {
          console.log('Texture loaded successfully:', url, texture)
          texture.colorSpace = THREE.SRGBColorSpace
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping
          texture.flipY = true
          resolve(texture)
        },
        (progress) => {
          console.log('Texture loading progress:', url, progress)
        },
        (error) => {
          console.error('Texture loading failed:', url, error)
          reject(error)
        }
      )
    })
  }

  async loadEnvironment(url, renderer, scene) {
    return new Promise((resolve, reject) => {
      this.#exrLoader.load(
        url,
        (texture) => {
          const pmremGenerator = new THREE.PMREMGenerator(renderer)
          const envMap = pmremGenerator.fromEquirectangular(texture).texture

          scene.environment = envMap
          scene.background = envMap

          pmremGenerator.dispose()
          texture.dispose()

          resolve(envMap)
        },
        undefined,
        reject
      )
    })
  }
}
