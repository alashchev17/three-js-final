import * as THREE from 'three'
import { Camera } from './Camera.js'
import { Renderer } from './Renderer.js'
import { Scene } from './Scene.js'
import { Loaders } from './Loaders.js'
import { Wall } from '../components/Wall.js'
import { Frame } from '../components/Frame.js'
import { InteractivePlane } from '../components/InteractivePlane.js'
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
  #debug
  #orbitControls

  constructor() {
    this.#canvas = document.getElementById('canvas')
    this.#clock = new THREE.Clock()

    this.init()
  }

  async init() {
    // Initialize core components
    this.#scene = new Scene()
    this.#camera = new Camera()
    this.#renderer = new Renderer(this.#canvas)
    this.#loaders = new Loaders()
    this.#mouse = new Mouse()
    this.#raycaster = new Raycaster(this.#camera.instance, this.#scene.instance)
    this.#debug = new Debug({ enableStats: true })
    this.#orbitControls = new OrbitControlsWrapper(this.#camera.instance, this.#canvas)

    // Load assets
    await this.#loadAssets()

    // Setup components
    this.#setupComponents()

    // Setup debug UI
    this.#setupDebugUI()

    // Setup events
    this.#setupEvents()

    // Start animation loop
    this.#animate()
  }

  async #loadAssets() {
    try {
      const [wallGltf, frameGltf] = await Promise.all([
        this.#loaders.loadGLTF('/models/cracked_red_brick_wall_low_poly_high_detail.glb'),
        this.#loaders.loadGLTF('/models/picture_frame.glb'),
      ])

      const [textureA, textureB, cloudNoiseTexture, paintNoiseTexture, brushTexture] = await Promise.all([
        this.#loaders.loadTexture('/textures/imagery/1.jpg'),
        this.#loaders.loadTexture('/textures/imagery/2.jpg'),
        this.#loaders.loadTexture('/textures/cloud-noise/cloud_noise.png'),
        this.#loaders.loadTexture('/textures/cloud-noise/paint_noise.png'),
        this.#loaders.loadTexture('/textures/paint-brush-mask.webp'),
      ])

      try {
        await this.#loaders.loadEnvironment('/env-map/bethnal_green_entrance_4k.exr', this.#renderer.instance, this.#scene.instance)
      } catch (envError) {
        console.warn('HDRI failed to load, using fallback lighting.')
        this.#scene.setupFallbackLighting()
      }

      this.#assets = { wallGltf, frameGltf, textureA, textureB, cloudNoiseTexture, paintNoiseTexture, brushTexture }
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

    const { wallGltf, frameGltf, textureA, textureB, cloudNoiseTexture, paintNoiseTexture, brushTexture } = this.#assets

    this.#wall = new Wall(wallGltf)
    this.#wall.group.position.set(0, -7.5, 14.4)
    this.#wall.group.rotation.set(-0.025, 0, 0)

    this.#frame = new Frame(frameGltf)
    this.#interactivePlane = new InteractivePlane(
      [textureA, textureB],
      cloudNoiseTexture,
      paintNoiseTexture,
      brushTexture,
      this.#renderer.instance
    )

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

    const box = new THREE.Box3().setFromObject(frameG)
    const size = new THREE.Vector3()
    box.getSize(size)

    const center = new THREE.Vector3()
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

  #setupDebugUI() {
    const debugControls = [
      {
        name: 'Orbit Controls',
        property: 'orbitControls',
        type: 'boolean',
        initialValue: false,
        onChange: (value) => {
          if (value) {
            this.#orbitControls.enable()
          } else {
            this.#orbitControls.disable()
          }
        },
      },
      {
        name: 'Show Wall',
        property: 'showWall',
        type: 'boolean',
        initialValue: true,
        onChange: (value) => setVisibility(this.#wall?.group, value),
      },
      {
        name: 'Show Frame',
        property: 'showFrame',
        type: 'boolean',
        initialValue: true,
        onChange: (value) => setVisibility(this.#frame?.group, value),
      },
      {
        name: 'Show Plane',
        property: 'showPlane',
        type: 'boolean',
        initialValue: true,
        onChange: (value) => setVisibility(this.#interactivePlane?.mesh, value),
      },
      {
        name: 'Wireframe Mode',
        property: 'wireframe',
        type: 'boolean',
        initialValue: false,
        onChange: (value) => {
          if (this.#wall) setWireframeMode(this.#wall.group, value)
          if (this.#frame) setWireframeMode(this.#frame.group, value)
        },
      },
      // Frame Transform controls
      {
        name: 'Scale',
        property: 'frameScale',
        type: 'range',
        range: [0.01, 1.0, 0.01],
        folder: 'Frame Transform',
        initialValue: this.#frame.group.scale.x,
        onChange: (value) => {
          this.#frame.group.scale.setScalar(value)
          this.#updateInteractivePlane()
        },
      },
      {
        name: 'Position X',
        property: 'frameX',
        type: 'range',
        range: [-10, 5, 0.1],
        folder: 'Frame Transform',
        initialValue: this.#frame.group.position.x,
        onChange: (value) => {
          this.#frame.group.position.x = value
          this.#updateInteractivePlane()
        },
      },
      {
        name: 'Position Y',
        property: 'frameY',
        type: 'range',
        range: [-10, 5, 0.1],
        folder: 'Frame Transform',
        initialValue: this.#frame.group.position.y,
        onChange: (value) => {
          this.#frame.group.position.y = value
          this.#updateInteractivePlane()
        },
      },
      {
        name: 'Position Z',
        property: 'frameZ',
        type: 'range',
        range: [-10, 2, 0.1],
        folder: 'Frame Transform',
        initialValue: this.#frame.group.position.z,
        onChange: (value) => {
          this.#frame.group.position.z = value
          this.#updateInteractivePlane()
        },
      },
      {
        name: 'Rotation X',
        property: 'frameRotationX',
        type: 'range',
        range: [0, Math.PI * 2, 0.01],
        folder: 'Frame Transform',
        initialValue: this.#frame.group.rotation.x,
        onChange: (value) => {
          this.#frame.group.rotation.x = value
          this.#updateInteractivePlane()
        },
      },
      {
        name: 'Rotation Y',
        property: 'frameRotationY',
        type: 'range',
        range: [0, Math.PI * 2, 0.01],
        folder: 'Frame Transform',
        initialValue: this.#frame.group.rotation.y,
        onChange: (value) => {
          this.#frame.group.rotation.y = value
          this.#updateInteractivePlane()
        },
      },
      {
        name: 'Rotation Z',
        property: 'frameRotationZ',
        type: 'range',
        range: [0, Math.PI * 2, 0.01],
        folder: 'Frame Transform',
        initialValue: this.#frame.group.rotation.z,
        onChange: (value) => {
          this.#frame.group.rotation.z = value
          this.#updateInteractivePlane()
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
      this.#interactivePlane?.updateMouse(normalized)
      this.#raycaster.updatePointer(normalized)

      // Check raycaster intersection with the plane
      if (this.#interactivePlane) {
        const intersection = this.#raycaster.getFirstIntersection([this.#interactivePlane.mesh])
        this.#interactivePlane.updateIntersection(intersection)
      }
    })

    window.addEventListener('resize', () => this.#resize())
  }

  #resize() {
    this.#camera.updateAspect()
    this.#renderer.updateSize()
  }

  #animate = () => {
    const dTime = this.#clock.getDelta()
    const time = this.#clock.elapsedTime

    if (this.#interactivePlane) {
      this.#interactivePlane.update(time, dTime)
    }

    this.#orbitControls.update()
    this.#debug.update()
    this.#renderer.render(this.#scene.instance, this.#camera.instance)

    requestAnimationFrame(this.#animate)
  }
}
