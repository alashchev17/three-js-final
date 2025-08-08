import {
  Vector2,
  WebGLRenderTarget,
  LinearFilter,
  RGBAFormat,
  Scene,
  OrthographicCamera,
  Mesh,
  CircleGeometry,
  MeshBasicMaterial,
  Texture,
  ShaderMaterial,
  PlaneGeometry,
  MathUtils,
  FrontSide,
} from 'three'
import vertexShader from '../shaders/interactive/index.vert?raw'
import fragmentShader from '../shaders/interactive/index.frag?raw'

export class InteractivePlane {
  #uniforms
  #material
  #previousMouse = new Vector2(0, 0)
  #mouseVelocity = 0
  #drawMapRenderTarget
  #brushMesh
  #brushScene
  #brushCamera

  // TODO: not nice :/
  #x = -2.5
  #y = -2.5
  #hasActiveIntersection = false

  constructor(textures, brushTexture, renderer) {
    this.renderer = renderer
    this.#setupDrawMap()
    this.#createMaterial(textures, brushTexture)
    this.#createMesh()
  }

  #setupDrawMap() {
    this.#drawMapRenderTarget = new WebGLRenderTarget(1024 * 1.4, 1024, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
    })

    const originalTarget = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(this.#drawMapRenderTarget)
    this.renderer.setClearColor(0x000000, 1.0)
    this.renderer.clear()
    this.renderer.setRenderTarget(originalTarget)

    this.#brushScene = new Scene()
    this.#brushCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.#brushMesh = new Mesh(new CircleGeometry(0.25, 16), new MeshBasicMaterial({ color: 0xffffff }))

    this.#brushMesh.position.y = this.#y
    this.#brushScene.add(this.#brushMesh)
  }

  #createMaterial(textures, brushTexture) {
    const textureA = textures[0] || new Texture()
    const textureB = textures[1] || new Texture()

    this.#uniforms = {
      uTime: { value: 0 },
      uTextureA: { value: textureA },
      uTextureB: { value: textureB },
      uDrawMap: { value: this.#drawMapRenderTarget.texture },
      uBrushTexture: { value: brushTexture },
      uRevealFactor: { value: 0.554 },
      uInvertTextureA: { value: false },
      // TODO: better to make this thing not hardcoded in the shader, but have no time :(
      // uAspectRatio: { value: aspectRatio },
    }

    this.#material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      side: FrontSide,
    })
  }

  #createMesh() {
    const geometry = new PlaneGeometry(1.0, 1.4)
    this.mesh = new Mesh(geometry, this.#material)
    this.mesh.castShadow = false
    this.mesh.receiveShadow = false
  }

  update(time, dTime) {
    this.#uniforms.uTime.value = time
    this.#mouseVelocity *= 0.9

    if (this.#hasActiveIntersection) {
      this.#brushMesh.position.x = MathUtils.damp(this.#brushMesh.position.x, this.#x, 5.0, dTime)
      this.#brushMesh.position.y = MathUtils.damp(this.#brushMesh.position.y, this.#y, 5.0, dTime)
    } else {
      this.#brushMesh.position.x = this.#x
      this.#brushMesh.position.y = this.#y
    }

    const brushScale = 1 + this.#mouseVelocity * 0.3
    this.#brushMesh.scale.setScalar(brushScale)

    if (this.#hasActiveIntersection) {
      const originalTarget = this.renderer.getRenderTarget()
      const originalAutoClear = this.renderer.autoClear

      this.renderer.setRenderTarget(this.#drawMapRenderTarget)
      this.renderer.autoClear = false
      this.renderer.render(this.#brushScene, this.#brushCamera)

      this.renderer.autoClear = originalAutoClear
      this.renderer.setRenderTarget(originalTarget)
    }
  }

  updateMouse(mouse) {
    const deltaX = mouse.x - this.#previousMouse.x
    const deltaY = mouse.y - this.#previousMouse.y
    const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10

    this.#mouseVelocity = Math.max(speed, this.#mouseVelocity)
    this.#previousMouse.copy(mouse)
  }

  #renderDrawMap(uv) {
    this.#x = uv.x * 2 - 1
    this.#y = uv.y * 2 - 1
  }

  updateIntersection(intersection) {
    const wasIntersecting = this.#hasActiveIntersection
    const isIntersecting = intersection && intersection.uv

    this.#hasActiveIntersection = isIntersecting

    if (isIntersecting) {
      this.#renderDrawMap(intersection.uv)

      if (!wasIntersecting) {
        const offset = 0.25
        const { x, y } = intersection.uv
        const distances = [x, 1 - x, 1 - y, y]
        const minDist = Math.min(...distances)

        let offsetX = 0,
          offsetY = 0
        if (minDist === distances[0]) offsetX = -offset // left
        else if (minDist === distances[1]) offsetX = offset // right
        else if (minDist === distances[2]) offsetY = offset // top
        else offsetY = -offset // bottom

        this.#brushMesh.position.x = this.#x + offsetX
        this.#brushMesh.position.y = this.#y + offsetY
      }
    }
  }

  get uniforms() {
    return this.#uniforms
  }
}
