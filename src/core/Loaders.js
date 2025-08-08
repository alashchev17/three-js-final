import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { TextureLoader, SRGBColorSpace, RepeatWrapping, PMREMGenerator } from 'three'

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

    this.#textureLoader = new TextureLoader()

    this.#exrLoader = new EXRLoader()
  }

  async loadGLTF(url) {
    return new Promise((resolve, reject) => {
      this.#gltfLoader.load(url, resolve, undefined, reject)
    })
  }

  async loadTexture(url) {
    return new Promise((resolve, reject) => {
      this.#textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = SRGBColorSpace
          texture.wrapS = texture.wrapT = RepeatWrapping
          texture.flipY = true
          resolve(texture)
        },
        undefined,
        (error) => {
          console.error('Texture loading failed:', url, error)
          reject(error)
        }
      )
    })
  }

  async loadEnvironment(url, renderer, scene, options = {}) {
    const { environmentIntensity = 0.5, backgroundIntensity = 0.3 } = options
    
    return new Promise((resolve, reject) => {
      this.#exrLoader.load(
        url,
        (texture) => {
          const pmremGenerator = new PMREMGenerator(renderer)
          const envMap = pmremGenerator.fromEquirectangular(texture).texture

          scene.environment = envMap
          scene.background = envMap
          scene.environmentIntensity = environmentIntensity
          scene.backgroundIntensity = backgroundIntensity

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
