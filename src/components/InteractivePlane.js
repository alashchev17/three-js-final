import * as THREE from 'three'
import vertexShader from '../shaders/interactive/index.vert?raw'
import fragmentShader from '../shaders/interactive/index.frag?raw'

export class InteractivePlane {
  #uniforms
  #material
  #previousMouse = new THREE.Vector2(0, 0)
  #mouseVelocity = 0

  // DrawMap render target system
  #drawMapRenderTarget
  #brushMesh
  #brushScene
  #brushCamera

  // TODO: not nice :/
  #x = -2.5
  #y = -2.5

  constructor(textures, cloudNoiseTexture, paintNoiseTexture, brushTexture, renderer) {
    this.renderer = renderer
    this.#setupDrawMap()
    this.#createMaterial(textures, cloudNoiseTexture, paintNoiseTexture, brushTexture)
    this.#createMesh()
  }

  #setupDrawMap() {
    this.#drawMapRenderTarget = new THREE.WebGLRenderTarget(512 * 1.4, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    })

    // Initialize with black background
    const originalTarget = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(this.#drawMapRenderTarget)
    this.renderer.setClearColor(0x000000, 1.0)
    this.renderer.clear()
    this.renderer.setRenderTarget(originalTarget)

    // Simple brush system (back to working version)
    this.#brushScene = new THREE.Scene()
    this.#brushCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const brushGeometry = new THREE.CircleGeometry(0.25, 16)
    const brushMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: false,
    })

    this.#brushMesh = new THREE.Mesh(brushGeometry, brushMaterial)

    this.#brushMesh.position.y = this.#y
    this.#brushScene.add(this.#brushMesh)
  }

  #createMaterial(textures, cloudNoiseTexture, paintNoiseTexture, brushTexture) {
    // Ensure textures exist
    const textureA = textures[0] || new THREE.Texture()
    const textureB = textures[1] || new THREE.Texture()
    const cloudNoise = cloudNoiseTexture || new THREE.Texture()
    const paintNoise = paintNoiseTexture || new THREE.Texture()

    // const aspectRatio
    this.#uniforms = {
      uTime: { value: 0 },
      uTextureA: { value: textureA },
      uTextureB: { value: textureB },
      uNoise: { value: cloudNoise },
      uPaintNoise: { value: paintNoise },
      uDrawMap: { value: this.#drawMapRenderTarget.texture },
      uBrushTexture: { value: brushTexture },
      // uAspectRatio: { value: aspectRatio },
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

  update(time, dTime) {
    this.#uniforms.uTime.value = time
    this.#mouseVelocity *= 0.9
    const tmpX = THREE.MathUtils.damp(this.#brushMesh.position.x, this.#x, 5.0, dTime)
    const tmpY = THREE.MathUtils.damp(this.#brushMesh.position.y, this.#y, 5.0, dTime)

    console.log(`[DEBUG]: tmpX: `, tmpX, `tmpY: `, tmpY)
    this.#brushMesh.position.x = tmpX
    this.#brushMesh.position.y = tmpY

    // Dynamic brush size based on velocity
    const brushScale = 1 + this.#mouseVelocity * 0.3
    this.#brushMesh.scale.setScalar(brushScale)

    // Render white circle without clearing existing content
    const originalTarget = this.renderer.getRenderTarget()
    const originalAutoClear = this.renderer.autoClear

    this.renderer.setRenderTarget(this.#drawMapRenderTarget)
    this.renderer.autoClear = false
    this.renderer.render(this.#brushScene, this.#brushCamera)

    this.renderer.autoClear = originalAutoClear
    this.renderer.setRenderTarget(originalTarget)
  }

  updateMouse(mouse) {
    const deltaX = mouse.x - this.#previousMouse.x
    const deltaY = mouse.y - this.#previousMouse.y
    const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10

    this.#mouseVelocity = Math.max(speed, this.#mouseVelocity)
    this.#previousMouse.copy(mouse)
  }

  #renderDrawMap(uv) {
    // Convert UV coordinates to render target space
    const x = uv.x * 2 - 1
    const y = uv.y * 2 - 1

    this.#x = x
    this.#y = y
  }

  updateIntersection(intersection) {
    if (intersection && intersection.uv) {
      this.#renderDrawMap(intersection.uv)
    }
  }
}
