import {
  Scene,
  OrthographicCamera,
  WebGLRenderTarget,
  LinearFilter,
  RGBAFormat,
  CircleGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  FrontSide,
} from 'three'
import { gsap } from 'gsap'
import vertexShader from '../shaders/interactive/index.vert?raw'
import fragmentShader from '../shaders/interactive/index.frag?raw'

export class PreloaderEffect {
  #uniforms
  #material
  #quadMesh
  #sceneTarget
  #drawTarget
  #brushMesh
  #brushScene
  #brushCamera
  #timeline
  #onComplete

  constructor(renderer, scene, camera, grainTexture, brushTexture, onComplete) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    this.brushTexture = brushTexture
    this.#onComplete = onComplete

    this.overlayScene = new Scene()
    this.overlayCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.#setupRenderTargets()
    this.#setupBrushSystem()
    this.#createOverlayMesh(grainTexture)
    this.#createTimeline()
  }

  #setupRenderTargets() {
    const { innerWidth: w, innerHeight: h } = window
    const params = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
    }

    this.#sceneTarget = new WebGLRenderTarget(w, h, { ...params, samples: 4 })
    this.#drawTarget = new WebGLRenderTarget(w, h, params)

    const prev = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(this.#drawTarget)
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.clear()
    this.renderer.setRenderTarget(prev)
  }

  #setupBrushSystem() {
    this.#brushScene = new Scene()
    this.#brushCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.#brushMesh = new Mesh(new CircleGeometry(0.2, 32), new MeshBasicMaterial({ color: 0xffffff }))
    this.#brushMesh.position.set(-2, -2, 0)
    this.#brushScene.add(this.#brushMesh)
  }

  #createOverlayMesh(grainTexture) {
    const geometry = new PlaneGeometry(2, 2)

    this.#uniforms = {
      uTextureA: { value: grainTexture },
      uTextureB: { value: this.#sceneTarget.texture },
      uDrawMap: { value: this.#drawTarget.texture },
      uBrushTexture: { value: this.brushTexture },
      uRevealFactor: { value: 0.0 },
      uShouldShowTextureA: { value: true },
    }

    this.#material = new ShaderMaterial({
      uniforms: this.#uniforms,
      vertexShader,
      fragmentShader,
      side: FrontSide,
    })

    this.#quadMesh = new Mesh(geometry, this.#material)
    this.overlayScene.add(this.#quadMesh)
  }

  #createTimeline() {
    this.#timeline = gsap.timeline({ paused: true })

    // Create systematic brush strokes: snake pattern with vignette margins
    const margin = 0.3
    const left = -1 + margin
    const right = 1 - margin
    const top = 1 - margin
    const bottom = -1 + margin
    const rows = 7
    const perRow = 6
    const paths = []

    for (let row = 0; row < rows; row++) {
      const y = top - (row / (rows - 1)) * (top - bottom)
      const isLeftToRight = row % 2 === 0

      for (let i = 0; i < perRow; i++) {
        const t = i / (perRow - 1)
        let x = isLeftToRight ? left + t * (right - left) : right - t * (right - left)

        // Add organic variation to avoid perfect grid
        x += (Math.random() - 0.5) * 0.1
        const yVar = y + (Math.random() - 0.5) * 0.08
        paths.push({ x, y: yVar })
      }

      if (row < rows - 1) {
        const skipX = isLeftToRight ? right + 0.2 : left - 0.2
        paths.push({ x: skipX, y: y - 0.1 })
      }
    }

    paths.forEach((p, i) => {
      this.#timeline.to(
        this.#brushMesh.position,
        {
          x: p.x,
          y: p.y,
          duration: 0.25,
          ease: 'power2.inOut',
          onUpdate: () => this.#drawBrush(),
        },
        i * 0.12
      )
    })

    this.#timeline.to(this.camera.position, { z: this.camera.position.z - 12.5, duration: 1.5, ease: 'power2.out' }, '<95%')

    this.#timeline.call(() => this.#onComplete?.())
  }

  #drawBrush() {
    const prevTarget = this.renderer.getRenderTarget()
    const prevAutoClear = this.renderer.autoClear

    this.renderer.setRenderTarget(this.#drawTarget)
    this.renderer.autoClear = false
    this.renderer.render(this.#brushScene, this.#brushCamera)

    this.renderer.autoClear = prevAutoClear
    this.renderer.setRenderTarget(prevTarget)
  }

  start() {
    this.#timeline.play()
  }

  update() {
    this.#quadMesh.visible = false

    const prev = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(this.#sceneTarget)
    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(prev)

    this.#quadMesh.visible = true
  }

  updateSize() {
    const { innerWidth: w, innerHeight: h } = window
    this.#sceneTarget.setSize(w, h)
    this.#drawTarget.setSize(w, h)
  }

  dispose() {
    this.#timeline?.kill()
    this.#sceneTarget?.dispose()
    this.#drawTarget?.dispose()
    this.#material?.dispose()
    this.#quadMesh?.geometry?.dispose()
  }
}
