import { Clock, Box3, Vector3 } from 'three'
import { Camera } from './Camera.js'
import { Renderer } from './Renderer.js'
import { Scene } from './Scene.js'
import { Loaders } from './Loaders.js'
import { Wall } from '../components/Wall.js'
import { Frame } from '../components/Frame.js'
import { InteractivePlane } from '../components/InteractivePlane.js'
import { PreloaderEffect } from '../components/PreloaderEffect.js'
import { Mouse } from '../utils/Mouse.js'
import { Raycaster } from '../components/Raycaster.js'
import { Debug } from '../utils/Debug.js'
import { OrbitControlsWrapper } from '../utils/OrbitControls.js'
import { setWireframeMode, setVisibility } from '../utils/SceneUtils.js'

export class App {
  #canvas
  #clock
  #scene
  #camera
  #renderer
  #loaders
  #mouse
  #raycaster
  #assets
  #wall
  #frame
  #interactivePlane
  #preloaderEffect
  #debug
  #orbitControls
  #isPreloaderActive = true

  constructor() {
    this.#canvas = document.getElementById('canvas')
    this.#clock = new Clock()
    this.init()
  }

  async init() {
    this.#scene = new Scene()
    this.#camera = new Camera()
    this.#renderer = new Renderer(this.#canvas)
    this.#loaders = new Loaders()
    this.#mouse = new Mouse()
    this.#raycaster = new Raycaster(this.#camera.instance, this.#scene.instance)
    this.#debug = new Debug({ enableStats: true })
    this.#orbitControls = new OrbitControlsWrapper(this.#camera.instance, this.#canvas)

    await this.#loadAssets()
    this.#setupComponents()
    this.#setupPreloader()
    this.#setupDebugUI()
    this.#setupEvents()
    this.#animate()
  }

  async #loadAssets() {
    try {
      const [wallGltf, frameGltf] = await Promise.all([
        this.#loaders.loadGLTF('/models/gallery_bare_concrete_wall.glb'),
        this.#loaders.loadGLTF('/models/picture_frame.glb'),
      ])

      const [textureA, textureB, grainPaperTexture, brushTexture] = await Promise.all([
        this.#loaders.loadTexture('/textures/imagery/1.jpg'),
        this.#loaders.loadTexture('/textures/imagery/2.jpg'),
        this.#loaders.loadTexture('/textures/paper-texture.jpg'),
        this.#loaders.loadTexture('/textures/paint-brush-mask.webp'),
      ])

      try {
        await this.#loaders.loadEnvironment('/env-map/bethnal_green_entrance_4k.exr', this.#renderer.instance, this.#scene.instance, {
          environmentIntensity: 0.5,
          backgroundIntensity: 0.3,
        })
      } catch (envError) {
        console.warn('HDRI failed to load, using fallback lighting.')
        this.#scene.setupFallbackLighting()
      }

      this.#assets = { wallGltf, frameGltf, textureA, textureB, grainPaperTexture, brushTexture }
    } catch (error) {
      console.error('Failed to load assets:', error)
      throw error
    }
  }

  #setupComponents() {
    if (!this.#assets) {
      console.error('Assets not loaded, cannot setup components')
      return
    }

    const { wallGltf, frameGltf, textureA, textureB, brushTexture } = this.#assets

    this.#wall = new Wall(wallGltf)
    this.#wall.group.position.set(0, 0, 0)
    this.#wall.group.rotation.set(-0.025, 0, 0)
    this.#wall.group.scale.setScalar(7)

    this.#frame = new Frame(frameGltf)
    this.#interactivePlane = new InteractivePlane([textureA, textureB], brushTexture, this.#renderer.instance)

    this.#scene.add(this.#wall.group)
    this.#scene.add(this.#frame.group)
    this.#scene.add(this.#interactivePlane.mesh)

    this.#updateInteractivePlane()
  }

  // Helper: re-compute position/scale of the interactive plane
  // so that it fills 90% of the frame's bounding box (plane stays flat)
  #updateInteractivePlane() {
    if (!this.#frame || !this.#interactivePlane) return

    const frameG = this.#frame.group
    const planeM = this.#interactivePlane.mesh

    const box = new Box3().setFromObject(frameG)
    const size = new Vector3()
    box.getSize(size)

    const center = new Vector3()
    box.getCenter(center)
    planeM.position.copy(center)

    const geom = planeM.geometry

    const nativeW = (geom.parameters && geom.parameters.width) || 1
    const nativeH = (geom.parameters && geom.parameters.height) || 1

    const scaleX = (size.x * 0.9) / nativeW
    const scaleY = (size.y * 0.9) / nativeH
    planeM.scale.set(scaleX, scaleY, 1)

    planeM.position.z += 0.01
  }

  #setupPreloader() {
    if (!this.#assets) return

    const { grainPaperTexture, brushTexture } = this.#assets

    this.#preloaderEffect = new PreloaderEffect(
      this.#renderer.instance,
      this.#scene.instance,
      this.#camera.instance,
      grainPaperTexture,
      brushTexture,
      () => {
        this.#isPreloaderActive = false
      }
    )

    setTimeout(() => {
      this.#preloaderEffect.start()
    }, 500)
  }

  #setupDebugUI() {
    const createTransformControls = (name, target, folder, updateCallback) => [
      {
        name: 'Scale',
        property: `${name}Scale`,
        type: 'range',
        range: [0.01, 10, 0.01],
        folder,
        initialValue: target.scale.x,
        onChange: (v) => {
          target.scale.setScalar(v)
          updateCallback?.()
        },
      },
      {
        name: 'Position X',
        property: `${name}X`,
        type: 'range',
        range: [-10, 10, 0.1],
        folder,
        initialValue: target.position.x,
        onChange: (v) => {
          target.position.x = v
          updateCallback?.()
        },
      },
      {
        name: 'Position Y',
        property: `${name}Y`,
        type: 'range',
        range: [-10, 10, 0.1],
        folder,
        initialValue: target.position.y,
        onChange: (v) => {
          target.position.y = v
          updateCallback?.()
        },
      },
      {
        name: 'Position Z',
        property: `${name}Z`,
        type: 'range',
        range: [-10, 10, 0.1],
        folder,
        initialValue: target.position.z,
        onChange: (v) => {
          target.position.z = v
          updateCallback?.()
        },
      },
      {
        name: 'Rotation X',
        property: `${name}RotX`,
        type: 'range',
        range: [0, Math.PI * 2, 0.01],
        folder,
        initialValue: target.rotation.x,
        onChange: (v) => {
          target.rotation.x = v
          updateCallback?.()
        },
      },
      {
        name: 'Rotation Y',
        property: `${name}RotY`,
        type: 'range',
        range: [0, Math.PI * 2, 0.01],
        folder,
        initialValue: target.rotation.y,
        onChange: (v) => {
          target.rotation.y = v
          updateCallback?.()
        },
      },
      {
        name: 'Rotation Z',
        property: `${name}RotZ`,
        type: 'range',
        range: [0, Math.PI * 2, 0.01],
        folder,
        initialValue: target.rotation.z,
        onChange: (v) => {
          target.rotation.z = v
          updateCallback?.()
        },
      },
    ]

    const debugControls = [
      {
        name: 'Orbit Controls',
        property: 'orbitControls',
        type: 'boolean',
        initialValue: false,
        onChange: (v) => (v ? this.#orbitControls.enable() : this.#orbitControls.disable()),
      },
      {
        name: 'Show Wall',
        property: 'showWall',
        type: 'boolean',
        initialValue: true,
        onChange: (v) => setVisibility(this.#wall?.group, v),
      },
      {
        name: 'Show Frame',
        property: 'showFrame',
        type: 'boolean',
        initialValue: true,
        onChange: (v) => setVisibility(this.#frame?.group, v),
      },
      {
        name: 'Show Plane',
        property: 'showPlane',
        type: 'boolean',
        initialValue: true,
        onChange: (v) => setVisibility(this.#interactivePlane?.mesh, v),
      },
      {
        name: 'Wireframe Mode',
        property: 'wireframe',
        type: 'boolean',
        initialValue: false,
        onChange: (v) => {
          if (this.#wall) setWireframeMode(this.#wall.group, v)
          if (this.#frame) setWireframeMode(this.#frame.group, v)
        },
      },

      ...createTransformControls('wall', this.#wall.group, 'Wall Transform'),
      ...createTransformControls('frame', this.#frame.group, 'Frame Transform', () => this.#updateInteractivePlane()),

      {
        name: 'Reveal Factor',
        property: 'uRevealFactor',
        folder: 'Shaders',
        type: 'range',
        range: [0, 3, 0.001],
        initialValue: this.#interactivePlane?.uniforms.uRevealFactor.value || 0,
        onChange: (v) => {
          if (this.#interactivePlane) {
            this.#interactivePlane.uniforms.uRevealFactor.value = v
            this.#updateInteractivePlane()
          }
        },
      },
      {
        name: 'Environment Intensity',
        property: 'environmentIntensity',
        folder: 'Environment',
        type: 'range',
        range: [0, 2, 0.01],
        initialValue: this.#scene.instance.environmentIntensity || 0.5,
        onChange: (v) => (this.#scene.instance.environmentIntensity = v),
      },
      {
        name: 'Background Intensity',
        property: 'backgroundIntensity',
        folder: 'Environment',
        type: 'range',
        range: [0, 2, 0.01],
        initialValue: this.#scene.instance.backgroundIntensity || 0.3,
        onChange: (v) => (this.#scene.instance.backgroundIntensity = v),
      },
      {
        name: 'Restart Preloader',
        property: 'restartPreloader',
        type: 'button',
        folder: 'Preloader',
        onChange: () => {
          if (this.#preloaderEffect) {
            this.#preloaderEffect.dispose()
            this.#scene.instance.remove(this.#preloaderEffect.mesh)
          }
          this.#isPreloaderActive = true
          this.#setupPreloader()
        },
      },
    ]

    this.#debug.add(debugControls)
  }

  #setupEvents() {
    this.#mouse.onMove((normalized) => {
      if (!this.#orbitControls.enabled) {
        this.#camera.updateFromMouse(normalized)
      }

      if (!this.#isPreloaderActive) {
        this.#interactivePlane?.updateMouse(normalized)
        this.#raycaster.updatePointer(normalized)

        if (this.#interactivePlane) {
          const intersection = this.#raycaster.getFirstIntersection([this.#interactivePlane.mesh])
          this.#interactivePlane.updateIntersection(intersection)
        }
      }
    })

    window.addEventListener('resize', () => this.#resize())
  }

  #resize() {
    this.#camera.updateAspect()
    this.#renderer.updateSize()
    this.#preloaderEffect?.updateSize()
  }

  #animate = () => {
    const dTime = this.#clock.getDelta()
    const time = this.#clock.elapsedTime

    if (this.#preloaderEffect) {
      this.#preloaderEffect.update(time)
    }

    if (this.#interactivePlane && !this.#isPreloaderActive) {
      this.#interactivePlane.update(time, dTime)
    }

    this.#orbitControls.update()
    this.#debug.update()

    this.#renderer.render(this.#scene.instance, this.#camera.instance)

    if (this.#preloaderEffect) {
      this.#renderer.autoClear = false
      this.#renderer.render(this.#preloaderEffect.overlayScene, this.#preloaderEffect.overlayCamera)
      this.#renderer.autoClear = true
    }

    requestAnimationFrame(this.#animate)
  }
}
