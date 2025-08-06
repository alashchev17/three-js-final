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

  constructor(textures, cloudNoiseTexture, paintNoiseTexture, renderer) {
    this.renderer = renderer
    this.#setupDrawMap()
    this.#createMaterial(textures, cloudNoiseTexture, paintNoiseTexture)
    this.#createMesh()
  }

  #setupDrawMap() {
    this.#drawMapRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
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
    
    const brushGeometry = new THREE.CircleGeometry(0.1, 16)
    const brushMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: false,
    })
    
    this.#brushMesh = new THREE.Mesh(brushGeometry, brushMaterial)
    this.#brushScene.add(this.#brushMesh)
  }

  #createMaterial(textures, cloudNoiseTexture, paintNoiseTexture) {
    // Ensure textures exist
    const textureA = textures[0] || new THREE.Texture()
    const textureB = textures[1] || new THREE.Texture()
    const cloudNoise = cloudNoiseTexture || new THREE.Texture()
    const paintNoise = paintNoiseTexture || new THREE.Texture()

    this.#uniforms = {
      uTime: { value: 0 },
      uTextureA: { value: textureA },
      uTextureB: { value: textureB },
      uNoise: { value: cloudNoise },
      uPaintNoise: { value: paintNoise },
      uDrawMap: { value: this.#drawMapRenderTarget.texture },
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
    this.#mouseVelocity *= 0.9
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
    
    this.#brushMesh.position.x = x
    this.#brushMesh.position.y = y
    
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

  updateIntersection(intersection) {
    if (intersection && intersection.uv) {
      this.#renderDrawMap(intersection.uv)
    }
  }
}
