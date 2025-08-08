import { Scene as ThreeScene, AmbientLight, DirectionalLight, PointLight, Color } from 'three'

export class Scene {
  constructor() {
    this.instance = new ThreeScene()
    this.#setupLighting()
  }

  #setupLighting() {
    const ambientLight = new AmbientLight(0x404040, 0.3)
    this.instance.add(ambientLight)

    const directionalLight = new DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.setScalar(2048)
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10

    this.instance.add(directionalLight)
  }

  setupFallbackLighting() {
    const fillLight = new DirectionalLight(0xffffff, 0.4)
    fillLight.position.set(-5, 5, 3)
    this.instance.add(fillLight)

    const warmLight = new PointLight(0xffaa66, 0.5, 20)
    warmLight.position.set(2, 3, 2)
    this.instance.add(warmLight)

    this.instance.background = new Color(0x222222)
  }

  add(object) {
    this.instance.add(object)
  }
}
